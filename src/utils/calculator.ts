// File: src/utils/calculator.ts
import { getAtrPerMin } from './atr';
import { GridParameters, GridResults } from '../types';

/**
 * Calculate estimated grid trading profit. If `atrPerMin` is omitted,
 * this will fetch a 200-period 1m and daily ATR from Binance and auto-blend.
 *
 * Includes two extra grid lines at the absolute lower and upper bounds,
 * so the effective number of grid levels is (gridCount + 2).
 */
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
  } = params;

  // Determine ATR per minute (either provided or fetched & blended)
  let atrPerMin = params.atrPerMin;
  if (atrPerMin === undefined) {
    if (!params.symbol) {
      throw new Error('Either atrPerMin or symbol must be provided.');
    }
    atrPerMin = await getAtrPerMin(params.symbol, 200);
  }

  // Include two extra grid lines at the bounds
  const effectiveGridCount = gridCount + 2;

  // Grid spacing = (upper - lower) / intervals
  const gridSpacing = (upperBound - lowerBound) / (effectiveGridCount - 1);

  // Estimated round-trip trades per day
  const estimatedTradesPerDay = (atrPerMin * 1440) / gridSpacing / 2;

  // Capital per grid level (now split across effectiveGridCount levels)
  const investmentPerGrid = principal / effectiveGridCount;

  // Profit per round-trip
  const grossProfitPerGrid =
    investmentPerGrid * (gridSpacing / lowerBound) * leverage;
  const feePerRoundTrip = investmentPerGrid * feePercent * 2;
  const netProfitPerGridTransaction = grossProfitPerGrid - feePerRoundTrip;

  // Daily & total profit
  const estimatedDailyProfit =
    netProfitPerGridTransaction * estimatedTradesPerDay;
  const totalEstimatedProfit = estimatedDailyProfit * durationDays;

  return {
    gridSpacing,
    estimatedTradesPerDay,
    investmentPerGrid,
    grossProfitPerGrid,
    feePerRoundTrip,
    netProfitPerGridTransaction,
    estimatedDailyProfit,
    totalEstimatedProfit,
    atrPerMin,
    durationDays
  };
};