// src/types.ts

/**
 * Parameters for the grid trading calculator.
 */

export interface GridParameters {
  symbol: string;
  botType: 'Long' | 'Short';
  principal: number;
  lowerBound: number;
  upperBound: number;
  gridCount: number;
  leverage: number;
  atrPerMin: number;      // must be nonzero!
  feePercent: number;     // decimal, e.g. 0.001 for 0.1%
  durationDays: number;
}
/**
 * Results returned by the grid trading calculator.
 */
export interface GridResults {
  totalEstimatedProfit: number;
  estimatedDailyProfit: number;
  investmentPerGrid: number;
  gridSpacing: number;
  estimatedTradesPerDay: number;
  netProfitPerGridTransaction: number;
  durationDays: number;
}

/**
 * Single point for profit-over-time chart.
 */
export interface ChartPoint {
  day: number;
  profit: number;
}
