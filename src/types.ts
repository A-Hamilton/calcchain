// src/types.ts

export enum EntryType { // Changed to enum for better type safety and iteration
  Long = "long",
  Short = "short",
  Neutral = "neutral"
}

export enum GridType { // Changed to enum
  Arithmetic = "arithmetic",
  Geometric = "geometric"
}

export interface GridParameters {
  symbol: string;
  principal: number;
  lowerBound: number;
  upperBound: number;
  gridCount: number;
  leverage: number;
  feePercent: number; 
  durationDays: number;
  atrPerMin?: number;
  atrPeriod?: number; 
  gridType?: GridType; // Use enum
  entryType?: EntryType; // Use enum
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
  gridType: GridType; // Use enum

  totalNetProfit: number; 
  totalGridProfit: number; 
  estimatedDailyGridProfit: number; 

  entryMessage?: string;
  principalReturnFromEntryExit?: number | null; 
  overallTotalValue?: number | null; 
}

export interface Metric {
  label: string;
  value: string | number | undefined; 
  isPrimary?: boolean; // Flag for special styling
}
