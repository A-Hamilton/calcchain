// File: src/types.ts

export interface GridParameters {
  symbol?: string;        // e.g. "BTCUSDT"
  principal: number;
  lowerBound: number;
  upperBound: number;
  gridCount: number;
  leverage: number;
  feePercent: number;
  durationDays: number;
  atrPerMin?: number;     // override fetch/blend if desired
}

export interface GridResults {
  gridSpacing: number;
  estimatedTradesPerDay: number;
  investmentPerGrid: number;
  grossProfitPerGrid: number;
  feePerRoundTrip: number;
  netProfitPerGridTransaction: number;
  estimatedDailyProfit: number;
  totalEstimatedProfit: number;
  atrPerMin: number;      // newly added
  durationDays: number; // newly added
}
