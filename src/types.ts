// src/types.ts

/**
 * Parameters passed to grid profit calculator.
 */
export interface GridParameters {
  symbol: string;
  botType: 'Long' | 'Short';
  principal: number;
  lowerBound: number;
  upperBound: number;
  gridCount: number;
  leverage: number;
  /** Combined ATR per minute (blend of daily & 1m) */
  atrPerMin: number;
  feePercent: number;
  /** Duration for the calculation, in days. */
  durationDays: number;
}

/**
 * Results returned by grid profit calculator.
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
