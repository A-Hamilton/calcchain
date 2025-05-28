// src/utils/calculator.tsx

import { GridParameters, GridResults } from "../types";
import { getAtrPerMin } from "./atr";

/**
 * Calculates grid trading profits and statistics given the strategy parameters.
 * Returns all relevant results, including daily and total profit, trade frequency, etc.
 * - buyPrice and sellPrice: Used for a "what if" principal change calculation (buy and hold/sell).
 */
export async function calculateGridProfit(
  params: GridParameters
): Promise<
  GridResults & {
    entryMessage?: string;
    principalReturnFromEntryExit?: number | null;
    overallTotalValue?: number | null;
  }
> {
  let {
    symbol,
    principal,
    lowerBound,
    upperBound,
    gridCount,
    leverage,
    feePercent,
    durationDays,
    atrPerMin,
    gridType = "arithmetic",
    entryType = "long",
    buyPrice,
    sellPrice,
  } = params;

  // Get ATR per minute based on daily ATR if not provided
  if (!atrPerMin) {
    if (!symbol) throw new Error("Symbol required for ATR lookup.");
    atrPerMin = await getAtrPerMin(symbol); // (1d ATR) / 1440
  }

  // Ensure values are numbers and feePercent is a true percent (e.g., 0.05 means 0.05%)
  principal = Number(principal);
  lowerBound = Number(lowerBound);
  upperBound = Number(upperBound);
  gridCount = Number(gridCount);
  leverage = Number(leverage);
  feePercent = Number(feePercent) / 100; // Convert from percent to decimal
  durationDays = Number(durationDays);
  atrPerMin = Number(atrPerMin);

  // --- Advanced: Warn if buyPrice or sellPrice is outside the grid ---
  let entryMessage = "";
  if (typeof buyPrice === "number" && !isNaN(buyPrice) && buyPrice > 0) {
    if (buyPrice < lowerBound || buyPrice > upperBound) {
      entryMessage = "Warning: Starting price is outside the grid range. Bot will not open trades until price enters grid.";
    }
  }
  if (typeof sellPrice === "number" && !isNaN(sellPrice) && sellPrice > 0) {
    if (sellPrice < lowerBound || sellPrice > upperBound) {
      entryMessage += (entryMessage ? " " : "") + "Warning: Sell/exit price is outside the grid range.";
    }
  }

  // Effective grids includes boundary grids
  const effectiveGridCount = gridCount + 2;
  const investmentPerGrid = principal / effectiveGridCount;

  // Compute grid spacing
  let gridSpacing: number;
  if (gridType === "geometric") {
    gridSpacing = Math.pow(upperBound / lowerBound, 1 / (gridCount + 1));
  } else {
    gridSpacing = (upperBound - lowerBound) / (gridCount + 1);
  }

  // Estimate trades per day using ATR (Average True Range)
  let estimatedTradesPerDay: number;
  if (gridType === "geometric") {
    const avgStep = lowerBound * (gridSpacing - 1);
    estimatedTradesPerDay = (atrPerMin * 1440) / avgStep / 2;
  } else {
    estimatedTradesPerDay = (atrPerMin * 1440) / gridSpacing / 2;
  }
  if (estimatedTradesPerDay < 0) estimatedTradesPerDay = 0;

  // Profit per grid transaction (gross & net, before/after fees)
  let grossProfitPerGrid: number;
  if (gridType === "geometric") {
    if (entryType === "short") {
      grossProfitPerGrid = investmentPerGrid * (1 - 1 / gridSpacing) * leverage;
    } else {
      grossProfitPerGrid = investmentPerGrid * (gridSpacing - 1) * leverage;
    }
  } else {
    if (entryType === "short") {
      grossProfitPerGrid = investmentPerGrid * (gridSpacing / upperBound) * leverage;
    } else {
      grossProfitPerGrid = investmentPerGrid * (gridSpacing / lowerBound) * leverage;
    }
  }

  // Fee per round trip (buy + sell)
  const feePerRoundTrip = investmentPerGrid * feePercent * 2;

  // Net profit per grid transaction
  const netProfitPerGridTransaction = grossProfitPerGrid - feePerRoundTrip;

  // Daily and total profits (gross and net)
  const estimatedDailyGridProfit = grossProfitPerGrid * estimatedTradesPerDay;
  const estimatedDailyProfit = netProfitPerGridTransaction * estimatedTradesPerDay;

  const totalGridProfit = estimatedDailyGridProfit * durationDays;
  const totalNetProfit = estimatedDailyProfit * durationDays;

  // -- Pure "buy and hold" (or short) profit/loss from buy/sell price, if both present --
  let principalReturnFromEntryExit: number | null = null;
  if (
    typeof buyPrice === "number" &&
    !isNaN(buyPrice) &&
    buyPrice > 0 &&
    typeof sellPrice === "number" &&
    !isNaN(sellPrice) &&
    sellPrice > 0
  ) {
    if (entryType === "short") {
      // For short, profit if price drops
      principalReturnFromEntryExit = principal * (1 - (sellPrice / buyPrice));
    } else {
      // For long or neutral, profit if price rises
      principalReturnFromEntryExit = principal * ((sellPrice / buyPrice) - 1);
    }
  }

  // Calculate overall total value (principal + net grid profit + buy/sell principal return if present)
  let overallTotalValue: number | null = principal + totalNetProfit;
  if (
    typeof principalReturnFromEntryExit === "number" &&
    !isNaN(principalReturnFromEntryExit)
  ) {
    overallTotalValue += principalReturnFromEntryExit;
  }

  return {
    gridSpacing,
    estimatedTradesPerDay,
    investmentPerGrid,
    grossProfitPerGrid,
    feePerRoundTrip,
    netProfitPerGridTransaction,
    estimatedDailyProfit,
    atrPerMin,
    durationDays,
    totalNetProfit,
    totalGridProfit,
    estimatedDailyGridProfit,
    entryMessage: entryMessage || undefined,
    principalReturnFromEntryExit,
    overallTotalValue,
  };
}
