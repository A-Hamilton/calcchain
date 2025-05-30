// src/utils/calculator.ts

import { GridParameters, GridResults } from "../types";
import { getAtrPerMin } from "./atr";

const MINUTES_IN_DAY = 1440;

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
    atrPerMin: providedAtrPerMin, // Renamed to avoid conflict
    gridType = "arithmetic",
    entryType = "long",
    buyPrice, // Optional: user's intended entry price for the whole position
    sellPrice, // Optional: user's intended exit price for the whole position
  } = params;

  let atrPerMinToUse = providedAtrPerMin;

  // Get ATR per minute based on daily ATR if not provided
  if (atrPerMinToUse === undefined || atrPerMinToUse === null || isNaN(atrPerMinToUse)) {
    if (!symbol) throw new Error("Symbol required for ATR lookup if ATR per minute is not provided.");
    atrPerMinToUse = await getAtrPerMin(symbol); 
  }

  // Ensure values are numbers and feePercent is converted to a decimal for calculations
  principal = Number(principal);
  lowerBound = Number(lowerBound);
  upperBound = Number(upperBound);
  gridCount = Math.max(1, Number(gridCount)); // Ensure gridCount is at least 1
  leverage = Number(leverage);
  const feeDecimal = Number(feePercent) / 100; // Convert from percent to decimal
  durationDays = Number(durationDays);
  atrPerMinToUse = Number(atrPerMinToUse);

  if (upperBound <= lowerBound) {
    throw new Error("Upper bound must be greater than lower bound.");
  }
  if (gridCount <= 0) {
    throw new Error("Grid count must be positive.");
  }


  // --- Advanced: Warn if buyPrice or sellPrice is outside the grid ---
  let entryMessage = "";
  if (typeof buyPrice === "number" && !isNaN(buyPrice) && buyPrice > 0) {
    if (buyPrice < lowerBound || buyPrice > upperBound) {
      entryMessage = "Warning: Bot starting price (if set by buyPrice) is outside the grid range. Bot may not open trades immediately.";
    }
  }
  // Note: sellPrice here is for the overall position exit, not individual grid sells.

  // The number of price levels in the grid.
  // If gridCount is N, there are N+1 price levels defining N grids.
  const priceLevels = gridCount + 1; 
  
  // Investment per grid line (assuming principal is spread across all potential orders/levels)
  // This interpretation might vary. If principal is only for active grids, logic would differ.
  // Assuming here principal is total capital for the strategy, divided among grid lines.
  const investmentPerGrid = principal / gridCount; // Or priceLevels? Original had effectiveGridCount = gridCount + 2. Let's use gridCount for now.

  // Compute grid spacing
  let gridSpacing: number; // This is the price difference (arithmetic) or ratio (geometric) per grid
  let actualGrids: number[] = []; // Stores the actual price levels of the grid

  if (gridType === "geometric") {
    const ratioPerGrid = Math.pow(upperBound / lowerBound, 1 / gridCount);
    gridSpacing = ratioPerGrid; // Store the ratio itself
    actualGrids.push(lowerBound);
    for (let i = 1; i <= gridCount; i++) {
      actualGrids.push(actualGrids[i-1] * ratioPerGrid);
    }
  } else { // Arithmetic
    gridSpacing = (upperBound - lowerBound) / gridCount;
    actualGrids.push(lowerBound);
    for (let i = 1; i <= gridCount; i++) {
        actualGrids.push(actualGrids[i-1] + gridSpacing);
    }
    // Ensure upper bound is the last grid for arithmetic to avoid floating point issues if critical
    if (actualGrids[actualGrids.length-1] < upperBound && Math.abs(actualGrids[actualGrids.length-1] - upperBound) > 1e-9) {
        actualGrids[actualGrids.length-1] = upperBound; // Adjust last grid to be exactly upper bound
    }
  }


  // Estimate trades per day using ATR (Average True Range)
  // This estimates how many grid levels are crossed per day.
  // Each crossing of a grid level up and down is one round trip (buy and sell or sell and buy).
  let estimatedGridCrossingsPerDay: number;
  const averageGridStepValue = (upperBound - lowerBound) / gridCount; // Average monetary value of a grid step

  if (averageGridStepValue > 0 && atrPerMinToUse > 0) {
    // Total price movement per day = atrPerMin * MINUTES_IN_DAY
    // Number of grid levels crossed = Total price movement / average monetary value of a grid step
    estimatedGridCrossingsPerDay = (atrPerMinToUse * MINUTES_IN_DAY) / averageGridStepValue;
  } else {
    estimatedGridCrossingsPerDay = 0;
  }
  // A "trade" or "transaction" usually implies a buy and a sell.
  // If a grid level is crossed, one side of a trade happens.
  // So, estimatedTradesPerDay (round trips) is roughly half of grid crossings if movement is directional,
  // or equal if it's oscillating perfectly. The original /2 was a simplification.
  // Let's assume estimatedGridCrossingsPerDay represents potential single order executions.
  // For profit calculation, we need profit per round-trip.
  const estimatedTradesPerDay = estimatedGridCrossingsPerDay / 2; // Number of round-trip grid profits per day


  // Profit per grid transaction (gross & net, before/after fees)
  let grossProfitPerGridTransaction: number; // Profit from one successful grid (buy low, sell higher by one step, or vice-versa)
  
  // For arithmetic, profit is investment_per_grid * (grid_spacing / entry_price_of_that_grid) * leverage
  // For geometric, profit is investment_per_grid * (grid_spacing_ratio - 1) * leverage
  // Using average step value for simplicity for gross profit calculation
  // This is an approximation as actual profit depends on which grid is hit.
  if (gridType === "geometric") {
      // (gridSpacing here is the ratio, e.g., 1.01 for 1% step)
      grossProfitPerGridTransaction = investmentPerGrid * (gridSpacing - 1) * leverage;
      if (entryType === "short") { // For short, profit is when price drops by one grid
        // Selling at P, buying back at P/gridSpacing. Profit = (P - P/gridSpacing) * (amount_of_asset)
        // Amount of asset = investmentPerGrid / P. So profit = investmentPerGrid * (1 - 1/gridSpacing)
         grossProfitPerGridTransaction = investmentPerGrid * (1 - (1 / gridSpacing)) * leverage;
      }
  } else { // Arithmetic
    // Profit per grid = (Quantity of asset) * gridSpacing_value
    // Quantity of asset = investmentPerGrid / average_price_in_grid
    // Using lowerBound as a proxy for entry price for simplicity in average calculation
    grossProfitPerGridTransaction = (investmentPerGrid / ((lowerBound + upperBound) / 2)) * gridSpacing * leverage;
  }


  // Fee per single trade (one buy or one sell)
  const feePerSingleTrade = investmentPerGrid * feeDecimal * leverage; // Fee is on the leveraged amount
  const feePerRoundTrip = feePerSingleTrade * 2;

  // Net profit per grid transaction (round trip)
  const netProfitPerGridTransaction = grossProfitPerGridTransaction - feePerRoundTrip;

  // Daily and total profits (gross and net from grid operations)
  const estimatedDailyGridProfitGross = grossProfitPerGridTransaction * estimatedTradesPerDay;
  const estimatedDailyProfitNet = netProfitPerGridTransaction * estimatedTradesPerDay;

  const totalGridProfitGross = estimatedDailyGridProfitGross * durationDays;
  const totalNetProfitFromGrids = estimatedDailyProfitNet * durationDays;

  // -- Pure "buy and hold" (or short) profit/loss from buy/sell price, if both present --
  let principalReturnFromEntryExit: number | null = null;
  if (
    typeof buyPrice === "number" && !isNaN(buyPrice) && buyPrice > 0 &&
    typeof sellPrice === "number" && !isNaN(sellPrice) && sellPrice > 0
  ) {
    // This calculation is for the change in value of the *initial principal*
    // if it were simply bought at buyPrice and sold at sellPrice (or vice-versa for short)
    // without grid trading.
    const quantity = (principal * leverage) / buyPrice; // Quantity bought with leveraged principal
    if (entryType === "short") {
      principalReturnFromEntryExit = (buyPrice - sellPrice) * quantity - (principal * leverage * feeDecimal * 2); // Profit from price drop, minus fees on entry & exit
    } else { // Long or Neutral
      principalReturnFromEntryExit = (sellPrice - buyPrice) * quantity - (principal * leverage * feeDecimal * 2); // Profit from price rise, minus fees on entry & exit
    }
    // Adjust for leverage: the return is on the leveraged amount, but relative to original principal
    principalReturnFromEntryExit = principalReturnFromEntryExit / leverage; 
  }


  // Calculate overall total value (initial principal + net grid profit + buy/sell principal return if present)
  let overallTotalValue: number | null = principal + totalNetProfitFromGrids;
  if (principalReturnFromEntryExit !== null) {
    // If principalReturnFromEntryExit is calculated, it represents the P/L of the base capital movement.
    // The grid profits are *additional* to this.
    // So, overall value = principal + principalReturnFromEntryExit (from base movement) + totalNetProfitFromGrids (from grid activity)
    overallTotalValue = principal + principalReturnFromEntryExit + totalNetProfitFromGrids;
  }


  return {
    gridSpacing: gridType === 'geometric' ? gridSpacing : averageGridStepValue, // Return ratio for geometric, value for arithmetic
    estimatedTradesPerDay,
    investmentPerGrid,
    grossProfitPerGrid: grossProfitPerGridTransaction, // Renamed for clarity
    feePerRoundTrip,
    netProfitPerGridTransaction,
    estimatedDailyProfit: estimatedDailyProfitNet, // Net daily from grids
    atrPerMin: atrPerMinToUse,
    durationDays,
    totalNetProfit: totalNetProfitFromGrids, // Net total from grids
    totalGridProfit: totalGridProfitGross, // Gross total from grids
    estimatedDailyGridProfit: estimatedDailyGridProfitGross, // Gross daily from grids
    entryMessage: entryMessage || undefined,
    principalReturnFromEntryExit,
    overallTotalValue,
  };
}
