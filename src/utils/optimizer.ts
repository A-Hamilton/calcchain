// src/utils/optimizer.ts

export interface OptimizeContext {
  symbol: string;
  principal: number; // Here, principal refers to the current price of the asset
  atr: number; // ATR value to use as minimum meaningful step
  feePercent: number; // As a percentage, e.g., 0.05 for 0.05%
  buyPrice?: number;
  sellPrice?: number;
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
  const { principal: currentPrice, atr, feePercent, buyPrice, sellPrice, gridType } = ctx;

  // Default to a ±5% range around current price, unless overridden by buy/sell price
  let lower = buyPrice !== undefined && !isNaN(buyPrice) ? buyPrice : currentPrice * 0.95;
  let upper = sellPrice !== undefined && !isNaN(sellPrice) ? sellPrice : currentPrice * 1.05;

  // Add buffer to the fee percent to ensure spacing covers fees and gives profit
  const bufferedFee = feePercent + 0.002; // +0.2% safety buffer
  const feeSpacing = 2 * bufferedFee * lower;
  const spacing = Math.max(feeSpacing, atr); // Minimum grid step: at least fees or ATR

  let count: number;

  if (gridType === "geometric") {
    // Geometric: use ratio spacing
    const ratio = upper / lower;
    const step = spacing / lower;
    if (ratio > 1 && step > 0) {
      count = Math.floor(Math.log(ratio) / Math.log(1 + step));
    } else {
      count = 1;
    }
  } else {
    // Arithmetic (default): even dollar spacing
    const rawCount = (upper - lower) / spacing;
    count = Math.max(1, Math.floor(rawCount));
  }

  // Clamp to reasonable bounds (for sanity)
  if (!isFinite(lower) || lower <= 0) lower = currentPrice * 0.95;
  if (!isFinite(upper) || upper <= 0 || upper <= lower) upper = currentPrice * 1.05;
  if (!isFinite(count) || count < 1) count = 1;

  return { lower, upper, count };
}
