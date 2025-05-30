// src/utils/calculator.ts

import { GridParameters, GridResults, GridType } from "../types"; // Import GridType
import { getAtrPerMin } from "./atr";
import { MINUTES_IN_DAY, DEFAULT_ATR_PERIOD } from '../constants';

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
    feePercent, // Expecting this as a percentage, e.g., 0.05 for 0.05%
    durationDays,
    atrPerMin: providedAtrPerMin, 
    atrPeriod = DEFAULT_ATR_PERIOD, // Use default if not provided in params
    gridType = "arithmetic", // Default to arithmetic if not provided
    entryType = "long",
    buyPrice, 
    sellPrice, 
  } = params;

  let atrPerMinToUse = providedAtrPerMin;

  if (atrPerMinToUse === undefined || atrPerMinToUse === null || isNaN(atrPerMinToUse)) {
    if (!symbol) throw new Error("Symbol required for ATR lookup if ATR per minute is not provided.");
    atrPerMinToUse = await getAtrPerMin(symbol, atrPeriod); 
  }

  principal = Number(principal);
  lowerBound = Number(lowerBound);
  upperBound = Number(upperBound);
  gridCount = Math.max(1, Number(gridCount)); 
  leverage = Number(leverage);
  const feeDecimal = Number(feePercent) / 100; 
  durationDays = Number(durationDays);
  atrPerMinToUse = Number(atrPerMinToUse);

  if (upperBound <= lowerBound) {
    throw new Error("Upper bound must be greater than lower bound.");
  }

  let entryMessage = "";
  if (typeof buyPrice === "number" && !isNaN(buyPrice) && buyPrice > 0) {
    if (buyPrice < lowerBound || buyPrice > upperBound) {
      entryMessage = "Warning: Bot starting price (if set by buyPrice) is outside the grid range. Bot may not open trades immediately.";
    }
  }

  if (gridCount === 0) throw new Error("Grid count cannot be zero for investment per grid calculation.");
  const investmentPerGrid = principal / gridCount; 

  let gridSpacingOutput: number; 
  let averageGridStepValue: number; 

  if (gridType === "geometric") {
    if (lowerBound <= 0) throw new Error("Lower bound must be positive for geometric grids.");
    const ratioPerGrid = Math.pow(upperBound / lowerBound, 1 / gridCount);
    gridSpacingOutput = ratioPerGrid; 
    averageGridStepValue = (upperBound - lowerBound) / gridCount; 
  } else { 
    averageGridStepValue = (upperBound - lowerBound) / gridCount;
    gridSpacingOutput = averageGridStepValue; 
  }

  let estimatedGridCrossingsPerDay: number;
  if (averageGridStepValue > 0 && atrPerMinToUse > 0) {
    estimatedGridCrossingsPerDay = (atrPerMinToUse * MINUTES_IN_DAY) / averageGridStepValue;
  } else {
    estimatedGridCrossingsPerDay = 0;
  }
  const estimatedTradesPerDay = estimatedGridCrossingsPerDay / 2; 

  let grossProfitPerGridTransaction: number; 
  
  if (gridType === "geometric") {
    grossProfitPerGridTransaction = investmentPerGrid * (gridSpacingOutput - 1) * leverage;
    if (entryType === "short") {
       grossProfitPerGridTransaction = investmentPerGrid * (1 - (1 / gridSpacingOutput)) * leverage;
    }
  } else { 
    const averagePriceInRange = (lowerBound + upperBound) / 2;
    if (averagePriceInRange <= 0) {
        // Handle case where average price is not positive, e.g. by setting profit to 0 or throwing error
        grossProfitPerGridTransaction = 0; // Or throw new Error("Average price in range is not positive...");
    } else {
        const quantityPerGridTrade = investmentPerGrid / averagePriceInRange;
        grossProfitPerGridTransaction = quantityPerGridTrade * gridSpacingOutput * leverage;
    }
  }

  const feePerSingleTrade = investmentPerGrid * feeDecimal * leverage; 
  const feePerRoundTrip = feePerSingleTrade * 2;
  const netProfitPerGridTransaction = grossProfitPerGridTransaction - feePerRoundTrip;

  const estimatedDailyGridProfitGross = grossProfitPerGridTransaction * estimatedTradesPerDay;
  const estimatedDailyProfitNet = netProfitPerGridTransaction * estimatedTradesPerDay;

  const totalGridProfitGross = estimatedDailyGridProfitGross * durationDays;
  const totalNetProfitFromGrids = estimatedDailyProfitNet * durationDays;

  let principalReturnFromEntryExit: number | null = null;
  if (
    typeof buyPrice === "number" && !isNaN(buyPrice) && buyPrice > 0 &&
    typeof sellPrice === "number" && !isNaN(sellPrice) && sellPrice > 0
  ) {
    const initialInvestmentForBuyHold = principal; 
    if (buyPrice <= 0) { // Prevent division by zero if buyPrice is invalid
        principalReturnFromEntryExit = 0; // Or handle error
    } else {
        const quantity = (initialInvestmentForBuyHold * leverage) / buyPrice; 
        let pnlFromPriceChange;
        if (entryType === "short") {
          pnlFromPriceChange = (buyPrice - sellPrice) * quantity;
        } else { 
          pnlFromPriceChange = (sellPrice - buyPrice) * quantity;
        }
        const entryTradeValue = initialInvestmentForBuyHold * leverage;
        const exitTradeValue = quantity * sellPrice; 
        const totalFeesForBuyHold = (entryTradeValue * feeDecimal) + (exitTradeValue * feeDecimal);
        const netPnlFromPriceChange = pnlFromPriceChange - totalFeesForBuyHold;
        principalReturnFromEntryExit = netPnlFromPriceChange / leverage; 
    }
  }

  let overallTotalValue: number | null = principal + totalNetProfitFromGrids;
  if (principalReturnFromEntryExit !== null) {
    overallTotalValue = principal + principalReturnFromEntryExit + totalNetProfitFromGrids;
  }

  return {
    gridSpacing: gridSpacingOutput, 
    estimatedTradesPerDay,
    investmentPerGrid,
    grossProfitPerGrid: grossProfitPerGridTransaction, 
    feePerRoundTrip,
    netProfitPerGridTransaction,
    estimatedDailyProfit: estimatedDailyProfitNet, 
    atrPerMin: atrPerMinToUse,
    durationDays,
    gridType: gridType as GridType, // Ensure the returned gridType matches the GridType type
    totalNetProfit: totalNetProfitFromGrids, 
    totalGridProfit: totalGridProfitGross, 
    estimatedDailyGridProfit: estimatedDailyGridProfitGross, 
    entryMessage: entryMessage || undefined,
    principalReturnFromEntryExit,
    overallTotalValue,
  };
}
