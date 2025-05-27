export type EntryType = "long" | "short" | "neutral";

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
  gridType?: "arithmetic" | "geometric";
  entryType?: EntryType;

  // Add these to support advanced config
  buyPrice?: number;
  sellPrice?: number;
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

  // For extended results
  totalNetProfit: number;
  totalGridProfit: number;
  estimatedDailyGridProfit: number;
}