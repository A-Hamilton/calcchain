// src/utils/optimizer.ts
import { DEFAULT_PRICE_RANGE_PERCENTAGE, FEE_SAFETY_BUFFER_PERCENTAGE } from '../constants';

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

  // Ensure upper is greater than lower, and handle edge cases
  if (upper <= lower) {
    lower = currentPrice * (1 - DEFAULT_PRICE_RANGE_PERCENTAGE);
    upper = currentPrice * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE);
    if (upper <= lower) { // Further fallback if currentPrice is tiny or zero
        upper = lower > 0 ? lower * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE * 2) : (atr > 0 ? atr * 2 : 0.01); // Ensure some range
        lower = lower > 0 ? lower : (atr > 0 ? atr : 0.005);
        if (upper <= lower) upper = lower + (atr > 0 ? atr : 0.005); // Absolute fallback
    }
  }


  // feePercent is e.g., 0.05 for 0.05%. Convert to decimal for calculation.
  const actualFeeDecimal = feePercent / 100;
  const bufferedFeeDecimal = actualFeeDecimal + FEE_SAFETY_BUFFER_PERCENTAGE; 
  
  // Minimum spacing required to cover round-trip fees (buy and sell)
  // Based on the lower end of the price range for a conservative estimate
  const feeBasedMinSpacing = 2 * bufferedFeeDecimal * lower;

  // The grid step should be at least the fee-based spacing or the ATR value (if ATR is positive)
  const spacing = atr > 0 ? Math.max(feeBasedMinSpacing, atr) : feeBasedMinSpacing; 
  if (spacing <= 0) { // If spacing is still zero (e.g., fees are zero and ATR is zero), use a tiny default
      // This prevents division by zero. The calculator should handle zero profit scenarios.
      // Consider what a sensible minimum spacing should be if all inputs suggest zero.
      // For now, let's assume the calculator will show zero profit if spacing is effectively zero.
      // However, for count calculation, we need a positive spacing.
      const fallbackSpacing = currentPrice * 0.0001; // 0.01% of current price as a tiny fallback
      // If currentPrice is also 0, this will be problematic.
      // The UI should ideally prevent such scenarios or the calculator should handle them.
      // For optimizer, we must return a valid count.
      if (fallbackSpacing <=0) {
          // If currentPrice is 0 or negative, this is a serious data issue.
          // Default to a minimal grid.
          return { lower: Math.max(0.000001, lower), upper: Math.max(0.000002, upper), count: 1 };
      }
       // Re-assign spacing if it was zero.
      // This part of logic implies that if spacing is zero, the optimizer might not be meaningful.
      // The UI or calculator should probably catch zero ATR / zero fee scenarios.
      // For now, if spacing is 0, we'll likely get a very high or infinite count, then clamped.
      // This is okay as long as the final count is reasonable (e.g., clamped).
      // A better approach might be to return early or throw if optimal params can't be determined.
  }


  let count: number;

  if (gridType === "geometric") {
    const ratio = upper / lower;
    const stepRatio = spacing > 0 ? spacing / lower : DEFAULT_PRICE_RANGE_PERCENTAGE / 10; // Avoid division by zero with a tiny step
    if (ratio > 1 && stepRatio > 0) {
      count = Math.floor(Math.log(ratio) / Math.log(1 + stepRatio));
    } else {
      count = 1; // Fallback if range is invalid or step is too small/large
    }
  } else { // Arithmetic
    if (spacing > 0) {
      const rawCount = (upper - lower) / spacing;
      count = Math.floor(rawCount);
    } else {
      // If spacing is zero (e.g., ATR and fees are zero), it implies infinite trades for any price movement.
      // This usually means the strategy is not viable or parameters are unrealistic.
      // Default to a sensible minimum grid count.
      count = 1; 
    }
  }

  // Clamp count to a reasonable minimum. Max count could also be considered.
  count = Math.max(1, count);
  if (!isFinite(count)) {
      count = 1; // Fallback for NaN/Infinity
  }


  // Final sanity checks for lower and upper bounds
  if (!isFinite(lower) || lower <= 0) lower = currentPrice > 0 ? currentPrice * (1 - DEFAULT_PRICE_RANGE_PERCENTAGE) : 0.000001;
  if (!isFinite(upper) || upper <= 0 || upper <= lower) upper = currentPrice > 0 ? currentPrice * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE) : lower * 1.01;
  if (upper <= lower) upper = lower + (atr > 0 ? atr : 0.000001); // Ensure upper > lower


  return { lower, upper, count };
}
