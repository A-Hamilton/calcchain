// src/utils/optimizer.ts

export interface OptimizeContext {
  symbol: string;
  currentPrice: number; // Explicitly require current asset price
  principal: number; // User's investment amount
  atr: number; // ATR value to use as minimum meaningful step
  feePercent: number; // As a percentage, e.g., 0.05 for 0.05%
  buyPrice?: number; // Optional user-defined buy price for range start
  sellPrice?: number; // Optional user-defined sell price for range end
  gridType?: "arithmetic" | "geometric";
}

export interface OptimalGridParams {
  lower: number;
  upper: number;
  count: number;
}

const DEFAULT_PRICE_RANGE_PERCENTAGE = 0.05; // 5%
const FEE_SAFETY_BUFFER_PERCENTAGE = 0.002; // 0.2%

/**
 * Suggests optimal grid trading parameters (lower bound, upper bound, grid count)
 * based on current price, volatility (ATR), and trading fee.
 */
export function computeOptimalGridParams(ctx: OptimizeContext): OptimalGridParams {
  const { currentPrice, atr, feePercent, buyPrice, sellPrice, gridType } = ctx;

  // Use user-defined buy/sell for range if provided, otherwise default to a range around currentPrice
  let lower = buyPrice !== undefined && !isNaN(buyPrice) && buyPrice > 0 
              ? buyPrice 
              : currentPrice * (1 - DEFAULT_PRICE_RANGE_PERCENTAGE);
  let upper = sellPrice !== undefined && !isNaN(sellPrice) && sellPrice > 0 
              ? sellPrice 
              : currentPrice * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE);

  // Ensure upper is greater than lower
  if (upper <= lower) {
    // Fallback if user inputs are invalid or result in non-positive range
    lower = currentPrice * (1 - DEFAULT_PRICE_RANGE_PERCENTAGE);
    upper = currentPrice * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE);
    if (upper <= lower && currentPrice > 0) { // Handle edge case where currentPrice might be extremely small
        upper = lower * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE * 2); // Ensure upper is greater
    } else if (currentPrice <= 0) { // Handle zero or negative current price
        lower = 1; // Arbitrary small positive numbers
        upper = 2;
    }
  }


  // Add buffer to the fee percent to ensure spacing covers fees and gives profit
  // feePercent is already a percentage (e.g., 0.05 for 0.05%), so convert to decimal for calculation
  const actualFeeDecimal = feePercent / 100;
  const bufferedFeeDecimal = actualFeeDecimal + FEE_SAFETY_BUFFER_PERCENTAGE; 
  
  // Minimum spacing required to cover round-trip fees (buy and sell)
  const feeBasedMinSpacing = 2 * bufferedFeeDecimal * lower; // Based on the lower end of the price range

  // The grid step should be at least the fee-based spacing or the ATR value
  const spacing = Math.max(feeBasedMinSpacing, atr); 

  let count: number;

  if (gridType === "geometric") {
    // Geometric: use ratio spacing
    const ratio = upper / lower;
    // The step here is the percentage increase for each grid level
    const stepRatio = spacing / lower; // Proportional step based on lower bound
    if (ratio > 1 && stepRatio > 0) {
      // Number of intervals = log(upper/lower) / log(1 + stepRatio)
      // Grid count is number of intervals - 1, but our definition of gridCount seems to be intervals.
      // Let's assume gridCount is the number of buy/sell lines *between* lower and upper.
      // The formula Math.log(ratio) / Math.log(1 + stepRatio) gives the number of steps.
      // If gridCount is number of actual grid lines, it's typically num_steps -1.
      // However, the original calculator uses `gridCount + 1` or `gridCount + 2` for effective grids.
      // For now, let's stick to a simple interpretation: number of profitable steps.
      count = Math.floor(Math.log(ratio) / Math.log(1 + stepRatio));
    } else {
      count = 1; // Fallback
    }
  } else {
    // Arithmetic (default): even dollar spacing
    if (spacing > 0) {
      const rawCount = (upper - lower) / spacing;
      count = Math.floor(rawCount);
    } else {
      count = 1; // Fallback if spacing is zero (e.g. ATR is zero)
    }
  }

  // Clamp to reasonable bounds (for sanity)
  if (!isFinite(lower) || lower <= 0) lower = currentPrice * (1 - DEFAULT_PRICE_RANGE_PERCENTAGE);
  if (!isFinite(upper) || upper <= 0 || upper <= lower) upper = currentPrice * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE);
  // Ensure upper is always greater than lower after clamping
    if (upper <= lower) {
        upper = lower * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE * 2);
         if (upper <= lower) upper = lower + atr; // Final fallback if still equal or less
    }

  if (!isFinite(count) || count < 1) count = 1;

  return { lower, upper, count: Math.max(1, count) }; // Ensure count is at least 1
}
