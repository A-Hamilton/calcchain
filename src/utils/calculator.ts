import { getAtrPerMin } from './atr';
import { GridParameters, GridResults, EntryType } from '../types';

export const calculateGridProfit = async (
  params: GridParameters
): Promise<GridResults & {
  totalNetProfit: number;
  totalGridProfit: number;
  estimatedDailyGridProfit: number;
}> => {
  const {
    principal,
    lowerBound,
    upperBound,
    gridCount,
    leverage,
    feePercent,
    durationDays,
    gridType,
    atrPerMin: atrArg,
    symbol,
    entryType = "long",
  } = params;

  // Always use lowerBound/upperBound for grid spacing
  const effectiveLower = lowerBound;
  const effectiveUpper = upperBound;

  let atrPerMin = atrArg;
  if (atrPerMin === undefined) {
    if (!symbol) {
      throw new Error('Either atrPerMin or symbol must be provided.');
    }
    atrPerMin = await getAtrPerMin(symbol, 200);
  }

  // Grid Spacing
  let gridSpacing = 0;
  if (gridType === "geometric") {
    gridSpacing = (effectiveUpper / effectiveLower) ** (1 / (gridCount + 1));
  } else {
    gridSpacing = (effectiveUpper - effectiveLower) / (gridCount + 1);
  }

  // Estimated trades per day (always positive)
  let estimatedTradesPerDay = 0;
  if (gridType === "geometric") {
    const avgStep = effectiveLower * (gridSpacing - 1);
    estimatedTradesPerDay = (atrPerMin * 1440) / avgStep / 2;
  } else {
    estimatedTradesPerDay = (atrPerMin * 1440) / gridSpacing / 2;
  }
  estimatedTradesPerDay = Math.max(estimatedTradesPerDay, 0);

  // Per-grid investment (split across gridCount+2 grids)
  const effectiveGridCount = gridCount + 2;
  const investmentPerGrid = principal / effectiveGridCount;

  // Grid profit per round-trip (before fees)
  let grossProfitPerGrid = 0;
  if (gridType === "geometric") {
    const avgStep = effectiveLower * (gridSpacing - 1);
    grossProfitPerGrid = investmentPerGrid * (avgStep / effectiveLower) * leverage;
  } else {
    grossProfitPerGrid = investmentPerGrid * (gridSpacing / effectiveLower) * leverage;
  }

  // Fees per round-trip
  const feePerRoundTrip = investmentPerGrid * feePercent * 2;

  // Net profit per grid round-trip (after fees)
  let netProfitPerGridTransaction = grossProfitPerGrid - feePerRoundTrip;

  // Entry Type
  if (entryType === "short") {
    // In short, grid profits are still grid profits, but people may expect negative sign for net profit if the bot is losing money
    // (i.e., grid profit could be negative if price is trending up)
    // Still, we do NOT flip trades per day sign.
  } else if (entryType === "neutral") {
    netProfitPerGridTransaction = 0;
    estimatedTradesPerDay = 0;
  }

  // Key values
  const estimatedDailyGridProfit = netProfitPerGridTransaction * estimatedTradesPerDay;
  const totalGridProfit = estimatedDailyGridProfit * durationDays;

  // "Total Net Profit" for a grid bot is usually just the sum of all completed grid profits (not including any holding/unrealized PnL).
  // If you want, you can add any unrealized PnL here, but for most calculators, it's just grid profit.
  const totalNetProfit = totalGridProfit;

  return {
    gridSpacing,
    estimatedTradesPerDay,
    investmentPerGrid,
    grossProfitPerGrid,
    feePerRoundTrip,
    netProfitPerGridTransaction,
    estimatedDailyProfit: estimatedDailyGridProfit, // for backcompat in UI
    totalEstimatedProfit: totalGridProfit, // for backcompat in UI
    atrPerMin,
    durationDays,
    totalNetProfit,
    totalGridProfit,
    estimatedDailyGridProfit,
  };
};