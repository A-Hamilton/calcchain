export interface OptimizeContext {
  symbol: string;
  principal: number;
  // add any other inputs you need, e.g. volatility, price history, etc.
}

export interface OptimalGridParams {
  lower: number;
  upper: number;
  count: number;
}

/**
 * computeOptimalGridParams
 *
 * Given a context (symbol, principal, maybe additional market data),
 * returns a suggested lower/upper price bound and grid count.
 *
 * TODO: replace this stub with your real optimizer logic
 * (e.g. fetch historical ATR, volatility, depth data, etc.).
 */
export function computeOptimalGridParams(
  ctx: OptimizeContext
): OptimalGridParams {
  // Simple placeholder logic: 
  // Use ±10% of current principal as price range, with 10 grids.
  const range = ctx.principal * 0.1;
  const lower = Math.max(1, ctx.principal - range / 2);
  const upper = ctx.principal + range / 2;
  const count = 10;

  return { lower, upper, count };
}
