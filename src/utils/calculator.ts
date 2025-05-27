import { getAtrPerMin } from './atr';
import { GridParameters, GridResults, EntryType } from '../types';

export const calculateGridProfit = async (
  params: GridParameters
): Promise<GridResults> => {
  const {
    principal,
    lowerBound,
    upperBound,
    gridCount,
    leverage,
    feePercent,
    durationDays,
    gridType = "arithmetic",
    atrPerMin: atrArg,
    symbol,
    entryType = "long",
  } = params;

  // ATR
  let atrPerMin = atrArg;
  if (atrPerMin === undefined) {
    if (!symbol) throw new Error('Either atrPerMin or symbol must be provided.');
    atrPerMin = await getAtrPerMin(symbol, 200);
  }

  const effectiveGridCount = gridCount + 2;
  const investmentPerGrid = principal / effectiveGridCount;

  // Grid Spacing
  let gridSpacing = 0;
  if (gridType === "geometric") {
    gridSpacing = (upperBound / lowerBound) ** (1 / (gridCount + 1));
  } else {
    gridSpacing = (upperBound - lowerBound) / (gridCount + 1);
  }

  // Estimated trades per day
  let estimatedTradesPerDay = 0;
  if (gridType === "geometric") {
    // Approximate: use average step size
    const avgStep = lowerBound * (gridSpacing - 1);
    estimatedTradesPerDay = (atrPerMin * 1440) / avgStep / 2;
  } else {
    estimatedTradesPerDay = (atrPerMin * 1440) / gridSpacing / 2;
  }
  estimatedTradesPerDay = Math.max(estimatedTradesPerDay, 0);

  // --- CORRECT GRID PROFIT CALCULATION ---
  let grossProfitPerGrid = 0;
  if (gridType === "geometric") {
    // For geometric, you can use the geometric mean as average price
    const avgPrice = Math.sqrt(lowerBound * upperBound);
    if (entryType === "short") {
      // Short: sell first (upper bound), buy lower (lower bound)
      grossProfitPerGrid = investmentPerGrid * (1 - 1 / gridSpacing) / 1 * leverage;
    } else {
      // Long: buy low, sell higher
      grossProfitPerGrid = investmentPerGrid * (gridSpacing - 1) / 1 * leverage;
    }
  } else {
    // Arithmetic grid
    if (entryType === "short") {
      // Short: sell at (buyPrice + gridSpacing), buy back at buyPrice
      // Use upperBound as sell price for estimation
      grossProfitPerGrid = investmentPerGrid * (gridSpacing / upperBound) * leverage;
    } else {
      // Long: buy at buyPrice, sell at buyPrice + gridSpacing
      // Use lowerBound as buy price for estimation
      grossProfitPerGrid = investmentPerGrid * (gridSpacing / lowerBound) * leverage;
    }
  }

  // --- FEES ---
  const feePerRoundTrip = investmentPerGrid * feePercent * 2;

  // --- NET PROFIT ---
  const netProfitPerGridTransaction = grossProfitPerGrid - feePerRoundTrip;

  // --- SUMMARIES ---
  const estimatedDailyGridProfit = grossProfitPerGrid * estimatedTradesPerDay;
  const totalGridProfit = estimatedDailyGridProfit * durationDays;
  const estimatedDailyNetProfit = netProfitPerGridTransaction * estimatedTradesPerDay;
  const totalNetProfit = estimatedDailyNetProfit * durationDays;

  return {
    gridSpacing,
    estimatedTradesPerDay,
    investmentPerGrid,
    grossProfitPerGrid,
    feePerRoundTrip,
    netProfitPerGridTransaction,
    estimatedDailyProfit: estimatedDailyNetProfit,
    totalEstimatedProfit: totalNetProfit,
    atrPerMin,
    durationDays,
    totalNetProfit,
    totalGridProfit,
    estimatedDailyGridProfit,
  };
};