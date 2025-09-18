// src/utils/optimizer.ts
import { DEFAULT_PRICE_RANGE_PERCENTAGE, FEE_SAFETY_BUFFER_PERCENTAGE } from '../constants';

export interface OptimizeContext {
  symbol: string; // Currently unused in this function, but available for context/future use
  currentPrice: number; // Explicitly require current asset price
  principal: number; // Currently unused in this function, but available for context/future use
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
  const { currentPrice, atr, feePercent, buyPrice, sellPrice, gridType = "arithmetic" } = ctx;

  // Use user-defined buy/sell for range if provided, otherwise default to a range around currentPrice
  let lower = buyPrice !== undefined && !isNaN(buyPrice) && buyPrice > 0
              ? buyPrice
              : currentPrice * (1 - DEFAULT_PRICE_RANGE_PERCENTAGE);
  let upper = sellPrice !== undefined && !isNaN(sellPrice) && sellPrice > 0
              ? sellPrice
              : currentPrice * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE);

  // Ensure upper is greater than lower, and handle edge cases for the range
  if (upper <= lower) {
    // Fallback 1: Default percentage range around current price
    lower = currentPrice * (1 - DEFAULT_PRICE_RANGE_PERCENTAGE);
    upper = currentPrice * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE);

    if (upper <= lower) { // Fallback 2: If currentPrice is tiny or zero
      const minAbsoluteStep = 0.000001; // A very small number to ensure difference
      const atrBasedStep = atr > 0 ? atr : minAbsoluteStep;

      // Try to establish a minimal valid range
      lower = (isFinite(lower) && lower > 0) ? lower : (atr > 0 ? Math.max(minAbsoluteStep, atr * 0.5) : minAbsoluteStep);
      upper = lower + atrBasedStep; // Ensure upper is at least one step above lower

      if (upper <= lower) { // Absolute last resort fallback
          lower = minAbsoluteStep;
          upper = lower + minAbsoluteStep;
      }
    }
  }

  // feePercent is e.g., 0.05 for 0.05%. Convert to decimal for calculation.
  const actualFeeDecimal = feePercent / 100;
  // FEE_SAFETY_BUFFER_PERCENTAGE is assumed to be a direct decimal value to add (e.g., 0.0002 for an additional 0.02%)
  const bufferedFeeDecimal = actualFeeDecimal + FEE_SAFETY_BUFFER_PERCENTAGE;

  // Minimum absolute price spacing required to cover round-trip fees (buy and sell)
  // Based on the lower end of the price range for a conservative estimate.
  const feeBasedMinSpacing = 2 * bufferedFeeDecimal * lower;

  // The grid step should be at least the fee-based spacing or the ATR value (if ATR is positive)
  const calculatedSpacing = atr > 0 ? Math.max(feeBasedMinSpacing, atr) : feeBasedMinSpacing;

  let spacingToUse = calculatedSpacing;

  if (spacingToUse <= 0) {
    // Attempt to derive a sensible positive spacing if calculatedSpacing is not positive
    let fallbackSpacingCandidate = currentPrice * 0.0001; // 0.01% of current price

    if (fallbackSpacingCandidate > 0) {
      spacingToUse = fallbackSpacingCandidate;
    } else if (atr > 0) {
      // If currentPrice is zero/neg, but ATR is positive (volatility measure exists)
      fallbackSpacingCandidate = atr * 0.1; // Use a fraction of ATR (e.g., 10%)
      spacingToUse = fallbackSpacingCandidate > 0 ? fallbackSpacingCandidate : 0.000001; // Ensure positive
    } else {
      // All indicators (price, ATR, fees) suggest no meaningful spacing.
      // This indicates an un-optimizable scenario or bad input data.
      // Default to a minimal grid setup and return.
      const finalLower = Math.max(0.000001, (isFinite(lower) && lower > 0) ? lower : 0.000001);
      const finalUpper = Math.max(finalLower + 0.000001, (isFinite(upper) && upper > finalLower) ? upper : finalLower + 0.000001);
      // console.warn("Optimizer: Un-optimizable scenario (currentPrice, ATR, fees lead to non-positive spacing). Returning minimal grid.");
      return { lower: finalLower, upper: finalUpper, count: 1 };
    }
  }
  // At this point, spacingToUse should be > 0.

  let count: number;

  if (gridType === "geometric") {
    if (lower <= 0 || upper <= lower) { // Geometric grids need positive lower bound and valid range
        // console.warn("Optimizer: Lower bound is not positive or range invalid for geometric grid count. Defaulting count to 1.");
        count = 1;
    } else {
        const rangeRatio = upper / lower;
        // desiredPercentageStep represents the desired percentage increase per grid,
        // derived from the absolute spacingToUse applied at the 'lower' price.
        const desiredPercentageStep = spacingToUse / lower; // spacingToUse is > 0, lower should be > 0 here

        if (rangeRatio > 1 && desiredPercentageStep > 0) {
            const logBase = Math.log(1 + desiredPercentageStep);
            // Prevent division by zero if desiredPercentageStep is extremely small
            if (logBase > 1e-10) {
                count = Math.floor(Math.log(rangeRatio) / logBase);
            } else {
                count = 1; // Fallback if logarithm base is too small
            }
        } else {
            count = 1; // Fallback if range is invalid or step is non-positive
        }
    }
  } else { // Arithmetic
    // spacingToUse is guaranteed positive here if we haven't returned early
    const rawCount = (upper - lower) / spacingToUse;
    count = Math.floor(rawCount);
  }

  // Clamp count to a reasonable minimum. Max count could also be considered.
  count = Math.max(1, count);
  if (!isFinite(count)) { // Handle potential NaN/Infinity from calculations if inputs were extreme
    count = 1;
  }

  // Final sanity checks for lower and upper bounds to ensure they are valid and usable
  const minPositiveValue = 0.000001;
  if (!isFinite(lower) || lower <= 0) {
      lower = currentPrice > 0 ? Math.max(minPositiveValue, currentPrice * (1 - DEFAULT_PRICE_RANGE_PERCENTAGE)) : minPositiveValue;
  }
  if (!isFinite(upper) || upper <= 0 || upper <= lower) {
      upper = currentPrice > 0 ? Math.max(lower + minPositiveValue, currentPrice * (1 + DEFAULT_PRICE_RANGE_PERCENTAGE)) : lower * 1.01;
      if (upper <= lower) { // Absolute ensure upper > lower
          upper = lower + (atr > 0 && isFinite(atr) ? Math.max(minPositiveValue, atr) : minPositiveValue);
      }
  }
   // Ensure at least some minimal difference if they ended up equal
   if (upper === lower) {
    upper = lower + minPositiveValue;
   }


  return { lower, upper, count };
}