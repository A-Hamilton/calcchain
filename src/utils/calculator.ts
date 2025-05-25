// src/utils/calculator.ts

import { GridParameters, GridResults } from '../types';

/**
 * Computes key metrics for a grid trading strategy.
 * Uses blended per-minute ATR to estimate trade frequency.
 */
export function calculateGridProfit(
  params: GridParameters
): GridResults {
  const {
    principal,
    gridCount,
    lowerBound,
    upperBound,
    leverage,
    atrPerMin,      // blended ATR per minute
    feePercent,
    durationDays,
  } = params;

  // 1. Grid spacing per level
  const gridSpacing = (upperBound - lowerBound) / gridCount;

  // 2. Estimated full round-trip trades per day:
  //    total intraday distance ≈ atrPerMin * 1440 minutes
  //    trades = (atrPerMin * 1440) / gridSpacing
  const estimatedTradesPerDay = (atrPerMin * 1440) / gridSpacing / 2; 
  // divide by 2 because atrPerMin*1440 is one-way distance sum

  // 3. Money allocated to each grid level
  const investmentPerGrid = principal / gridCount;

  // 4. Gross profit per round-trip (buy low → sell high)
  const grossProfitPerGrid =
    investmentPerGrid * (gridSpacing / lowerBound) * leverage;

  // 5. Fees per round-trip (buy + sell)
  const feePerRoundTrip = investmentPerGrid * feePercent * 2;

  // 6. Net profit per grid round-trip
  const netProfitPerGridTransaction = grossProfitPerGrid - feePerRoundTrip;

  // 7. Daily profit based on frequency
  const estimatedDailyProfit =
    netProfitPerGridTransaction * estimatedTradesPerDay;

  // 8. Total profit over user-defined duration
  const totalEstimatedProfit = estimatedDailyProfit * durationDays;

  return {
    totalEstimatedProfit,
    estimatedDailyProfit,
    investmentPerGrid,
    gridSpacing,
    estimatedTradesPerDay,
    netProfitPerGridTransaction,
    durationDays,
  };
}
