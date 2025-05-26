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
}

export interface OptimalGridParams {
  /** Lower price bound */
  lower: number;
  /** Upper price bound */
  upper: number;
  /**
   * Number of grid intervals so that
   * (upper – lower) / count ≈ net‐positive spacing
   */
  count: number;
}

/**
 * computeOptimalGridParams
 *
 * Builds a ±10% band around the current price, then determines
 * grid count so that each grid‐step spacing is at least
 * max(ATR, fees+0.2% buffer), ensuring post‐fee spacing.
 */
export function computeOptimalGridParams(
  ctx: OptimizeContext
): OptimalGridParams {
  const { principal /* actual price */, atr, feePercent } = ctx;

  // Define bounds ±10% around current price
  const lower = principal * 0.95;
  const upper = principal * 1.05;

  // Add a 0.2% (0.002) buffer to the user fee rate
  const bufferedFeeRate = feePercent + 0.002;

  // Compute minimum spacing needed to cover both entry & exit + buffer
  const feeSpacing = 2 * bufferedFeeRate * lower;

  // Our actual spacing per grid step must be at least this:
  const spacing = Math.max(atr, feeSpacing);

  // Derive count so that (upper−lower)/count ≈ spacing
  const rawCount = (upper - lower) / spacing;
  const count    = Math.max(1, Math.floor(rawCount));

  return { lower, upper, count };
}
