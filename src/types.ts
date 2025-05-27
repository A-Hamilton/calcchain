// src/types.ts

export type EntryType = "long" | "short" | "neutral";

export interface GridParameters {
  symbol: string;
  principal: number;
  lowerBound: number;
  upperBound: number;
  gridCount: number;
  leverage: number;
  feePercent: number;
  durationDays: number;
  // Advanced settings (optional)
  buyPrice?: number;
  sellPrice?: number;
  gridType?: "arithmetic" | "geometric";
  entryType?: EntryType;
  atrPerMin?: number;
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
  atrPerMin: number;
  durationDays: number;
}