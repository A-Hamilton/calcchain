// src/types.ts

export type EntryType = "long" | "short" | "neutral";

export type GridType = "arithmetic" | "geometric";

export interface GridParameters {
  symbol: string;
  principal: number;
  lowerBound: number;
  upperBound: number;
  gridCount: number;
  leverage: number;
  feePercent: number; // expressed as percent (e.g., 0.05 for 0.05%)
  durationDays: number;
  atrPerMin?: number;
  gridType?: GridType;
  entryType?: EntryType;
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
  atrPerMin: number;
  durationDays: number;

  // Additional summary metrics
  totalNetProfit: number;
  totalGridProfit: number;
  estimatedDailyGridProfit: number;

  // Optional advanced outputs
  entryMessage?: string;
  principalReturnFromEntryExit?: number | null;
  overallTotalValue?: number | null;
}

export interface Metric {
  label: string;
  value: string;
}