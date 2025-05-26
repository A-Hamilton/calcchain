// src/types.ts
export interface GridParameters {
  symbol: string;
  principal: number;
  lowerBound: number;
  upperBound: number;
  gridCount: number;
  leverage: number;
  feePercent: number;
  durationDays: number;
  atrPerMin: number;
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
  durationDays: number;
}
