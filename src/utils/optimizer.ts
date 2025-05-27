// File: src/utils/optimizer.ts

export interface OptimizeContext {
  /** Trading symbol, e.g. "BTCUSDT" */
  symbol: string;
  /** Current market price (used to build bounds) */
  principal: number;
  /** ATR-based target spacing per grid step */
  atr: number;
  /** Fee rate per side, e.g. 0.0005 for 0.05% */
  feePercent: number;
  /** Advanced (optional): lower override */
  buyPrice?: number;
  /** Advanced (optional): upper override */
  sellPrice?: number;
  /** Advanced (optional): grid type */
  gridType?: "arithmetic" | "geometric";
}

export interface OptimalGridParams {
  /** Lower price bound */
  lower: number;
  /** Upper price bound */
  upper: number;
  /**
   * Number of grid intervals so that
   * (upper – lower) / count ≈ net-positive spacing
   */
  count: number;
}

/**
 * computeOptimalGridParams
 *
 * Builds a ±10% band around the current price, then determines
 * grid count so that each grid-step spacing is at least
 * max(ATR, fees+0.2% buffer), ensuring post-fee spacing.
 * If buyPrice/sellPrice provided, use them as bounds.
 * If gridType is "geometric", count is calculated so that
 * (upper/lower) root count ≈ spacing (not implemented here for brevity).
 */
export const computeOptimalGridParams = (
  ctx: OptimizeContext
): OptimalGridParams => {
  const { principal, atr, feePercent, buyPrice, sellPrice, gridType } = ctx;

  // Use advanced overrides if present
  const lower = buyPrice !== undefined ? buyPrice : principal * 0.95;
  const upper = sellPrice !== undefined ? sellPrice : principal * 1.05;

  // Add a 0.2% (0.002) buffer to the user fee rate
  const bufferedFeeRate = feePercent + 0.002;

  // Compute minimum spacing needed to cover both entry & exit + buffer
  const feeSpacing = 2 * bufferedFeeRate * lower;

  // Actual spacing per grid step must be at least this:
  const spacing = Math.max(atr, feeSpacing);

  let count: number;
  if (gridType === "geometric") {
    // For geometric, use log ratio for grid count (approximate)
    // geometric spacing: upper = lower * r^count => count = log(upper/lower) / log(r)
    // Here, we estimate r so that the minimum step is at least spacing
    // r = (upper/lower)^(1/N); solve for N so that (upper/lower)^(1/N)-1 ≈ spacing/lower
    // N = log(upper/lower) / log(1 + spacing/lower)
    const ratio = upper / lower;
    const step = spacing / lower;
    if (ratio > 1 && step > 0) {
      count = Math.floor(Math.log(ratio) / Math.log(1 + step));
    } else {
      count = 1;
    }
  } else {
    // Arithmetic (default)
    const rawCount = (upper - lower) / spacing;
    count = Math.max(1, Math.floor(rawCount));
  }

  return { lower, upper, count };
};