// src/utils/calculator.ts

import { GridParameters, GridResults, GridType } from "../types";
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
    gridType = GridType.Arithmetic, // Default to arithmetic if not provided, using imported Enum
    entryType = "long", // Default entry type
    buyPrice,
    sellPrice,
  } = params;

  let atrPerMinToUse = providedAtrPerMin;

  if (atrPerMinToUse === undefined || atrPerMinToUse === null || isNaN(Number(atrPerMinToUse))) {
    if (!symbol) {
      throw new Error("Symbol is required for ATR lookup if ATR per minute is not provided.");
    }
    atrPerMinToUse = await getAtrPerMin(symbol, atrPeriod);
  }

  // Convert and validate core numerical parameters
  principal = Number(principal);
  lowerBound = Number(lowerBound);
  upperBound = Number(upperBound);
  gridCount = Math.max(1, Math.floor(Number(gridCount))); // Ensure gridCount is an integer >= 1
  leverage = Number(leverage);
  const feeDecimal = Number(feePercent) / 100;
  durationDays = Number(durationDays);
  atrPerMinToUse = Number(atrPerMinToUse); // Ensure it's a number for subsequent operations

  if (isNaN(principal) || principal <= 0) throw new Error("Principal must be a positive number.");
  if (isNaN(lowerBound)) throw new Error("Lower bound must be a valid number.");
  if (isNaN(upperBound)) throw new Error("Upper bound must be a valid number.");
  if (isNaN(leverage) || leverage < 1) throw new Error("Leverage must be a number greater than or equal to 1.");
  if (isNaN(feeDecimal) || feeDecimal < 0) throw new Error("Fee percent must be a non-negative number.");
  if (isNaN(durationDays) || durationDays <= 0) throw new Error("Duration days must be a positive number.");


  // ATR must be a non-negative finite number.
  if (!isFinite(atrPerMinToUse) || atrPerMinToUse < 0) {
    throw new Error(
      `Invalid ATR per minute value: ${params.atrPerMin}. Must be a non-negative finite number.`
    );
  }

  if (upperBound <= lowerBound) {
    throw new Error("Upper bound must be greater than lower bound.");
  }

  let entryMessage = "";
  if (typeof buyPrice === "number" && isFinite(buyPrice) && buyPrice > 0) {
    if (buyPrice < lowerBound || buyPrice > upperBound) {
      entryMessage = "Warning: Bot starting price (if set by buyPrice) is outside the grid range. Bot may not open trades immediately.";
    }
  }
  // gridCount is already guaranteed to be >= 1 by Math.max(1, ...)
  const investmentPerGrid = principal / gridCount;

  let gridSpacingOutput: number;
  let averageGridStepValue: number;

  if (gridType === GridType.Geometric) {
    if (lowerBound <= 0) {
      throw new Error("Lower bound must be positive for geometric grids.");
    }
    // Calculate the geometric ratio per grid
    const ratioPerGrid = Math.pow(upperBound / lowerBound, 1 / gridCount);
    if (!isFinite(ratioPerGrid) || ratioPerGrid <= 0) {
        throw new Error("Could not calculate a valid ratio for geometric grid. Check bounds and grid count.");
    }
    gridSpacingOutput = ratioPerGrid;
    // For estimating grid crossings, an arithmetic average step is used as an approximation for geometric grids.
    averageGridStepValue = (upperBound - lowerBound) / gridCount;
  } else { // Arithmetic grid
    averageGridStepValue = (upperBound - lowerBound) / gridCount;
    gridSpacingOutput = averageGridStepValue;
  }
  if (!isFinite(averageGridStepValue)) {
    throw new Error("Calculated grid step value is invalid. Check bounds and grid count.");
  }


  let estimatedGridCrossingsPerDay: number;
  // Ensure atrPerMinToUse and averageGridStepValue are valid for division
  if (atrPerMinToUse <= 0 || averageGridStepValue <= 0) {
    estimatedGridCrossingsPerDay = 0; // No volatility or no grid step means no crossings
  } else {
    estimatedGridCrossingsPerDay = (atrPerMinToUse * MINUTES_IN_DAY) / averageGridStepValue;
  }
  const estimatedTradesPerDay = estimatedGridCrossingsPerDay / 2; // Assuming half are round trips or one side of a trade

  let grossProfitPerGridTransaction: number;

  if (gridType === GridType.Geometric) {
    grossProfitPerGridTransaction = investmentPerGrid * (gridSpacingOutput - 1) * leverage; // gridSpacingOutput is the ratio
    if (entryType === "short") {
      // Profit from price drop: Investment * (1 - 1/Ratio)
      grossProfitPerGridTransaction = investmentPerGrid * (1 - (1 / gridSpacingOutput)) * leverage;
    }
  } else { // Arithmetic grid
    const averagePriceInRange = (lowerBound + upperBound) / 2;
    if (!isFinite(averagePriceInRange) || averagePriceInRange <= 0) {
      // console.warn("Average price in range is not positive or invalid for arithmetic grid, setting gross profit to 0.");
      grossProfitPerGridTransaction = 0;
    } else {
      // Quantity per trade is approximated using the average price in the range for arithmetic grids.
      // Actual quantity might vary if based on the exact grid line price or fixed base currency.
      const quantityPerGridTrade = investmentPerGrid / averagePriceInRange;
      grossProfitPerGridTransaction = quantityPerGridTrade * gridSpacingOutput * leverage; // gridSpacingOutput is the price step
    }
  }
  if (!isFinite(grossProfitPerGridTransaction)) grossProfitPerGridTransaction = 0; // Safeguard

  const feePerSingleTrade = investmentPerGrid * feeDecimal * leverage;
  const feePerRoundTrip = feePerSingleTrade * 2;
  const netProfitPerGridTransaction = grossProfitPerGridTransaction - feePerRoundTrip;

  const estimatedDailyGridProfitGross = grossProfitPerGridTransaction * estimatedTradesPerDay;
  const estimatedDailyProfitNet = netProfitPerGridTransaction * estimatedTradesPerDay;

  const totalGridProfitGross = estimatedDailyGridProfitGross * durationDays;
  const totalNetProfitFromGrids = estimatedDailyProfitNet * durationDays;

  let principalReturnFromEntryExit: number | null = null;
  if (
    typeof buyPrice === "number" && isFinite(buyPrice) && buyPrice > 0 &&
    typeof sellPrice === "number" && isFinite(sellPrice) && sellPrice > 0
  ) {
    const initialInvestmentForBuyHold = principal;
    // buyPrice > 0 is already checked above
    const quantity = (initialInvestmentForBuyHold * leverage) / buyPrice;
    if (!isFinite(quantity)) {
        principalReturnFromEntryExit = null; // Cannot calculate if quantity is invalid
        // entryMessage += " Could not calculate P/L from buy/sell due to invalid quantity."; // Optional
    } else {
        let pnlFromPriceChange;
        if (entryType === "short") {
          pnlFromPriceChange = (buyPrice - sellPrice) * quantity;
        } else { // Long
          pnlFromPriceChange = (sellPrice - buyPrice) * quantity;
        }

        const entryTradeValue = initialInvestmentForBuyHold * leverage; // Notional value
        const exitTradeValue = quantity * sellPrice; // Notional value
        
        const totalFeesForBuyHold = (entryTradeValue * feeDecimal) + (exitTradeValue * feeDecimal);
        const netPnlFromPriceChange = pnlFromPriceChange - totalFeesForBuyHold;
        
        // Return is on the original principal, so P/L is divided by leverage if comparing to unleveraged buy/hold
        // Or, if it's "what if this principal was used in this leveraged trade", then leverage factor is intrinsic.
        // The current approach `netPnlFromPriceChange / leverage` calculates return as if principal was unleveraged.
        // If the goal is to show profit from a leveraged spot buy/sell, then `netPnlFromPriceChange` is the raw P/L.
        // Let's assume it means the actual P/L of such a leveraged trade.
        // The prompt implies "principal change calculation", suggesting the P/L on the principal.
        // Dividing by leverage gives the P/L as if the *principal itself* grew/shrank by that factor due to the price move,
        // ignoring that the trade was leveraged. This makes it comparable to an unleveraged buy/hold of the principal.
        principalReturnFromEntryExit = netPnlFromPriceChange;
        // If definition is stricter "return ON principal", then /leverage makes sense.
        // For "total value of principal after this trade", it's principal + netPnlFromPriceChange
        // The existing overallTotalValue calculation seems to assume principalReturnFromEntryExit is the pure P/L.
    }
  }


  let overallTotalValue: number | null = principal + totalNetProfitFromGrids;
  if (principalReturnFromEntryExit !== null && isFinite(principalReturnFromEntryExit)) {
    // This implies principalReturnFromEntryExit is the P/L.
    // So, the final value is original principal + P/L from buy/hold + P/L from grids.
    overallTotalValue = principal + principalReturnFromEntryExit + totalNetProfitFromGrids;
  } else if (principalReturnFromEntryExit !== null && !isFinite(principalReturnFromEntryExit)) {
    // If P/L calculation resulted in NaN/Infinity, don't use it for overall total.
    // Keep overallTotalValue as principal + grid profits only.
    // A warning might be useful here.
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
    gridType: gridType, // No need for 'as GridType' as gridType is already correctly typed
    totalNetProfit: totalNetProfitFromGrids,
    totalGridProfit: totalGridProfitGross,
    estimatedDailyGridProfit: estimatedDailyGridProfitGross,
    entryMessage: entryMessage || undefined, // Ensure undefined if empty
    principalReturnFromEntryExit,
    overallTotalValue,
  };
}