import { describe, it, expect } from 'vitest';
import { computeOptimalGridParams, OptimizeContext } from '../utils/optimizer';

describe('computeOptimalGridParams', () => {
  const baseContext: OptimizeContext = {
    symbol: 'BTCUSDT',
    currentPrice: 50000,
    principal: 10000,
    atr: 100,
    feePercent: 0.1,
  };

  it('should handle basic arithmetic grid calculation', () => {
    const result = computeOptimalGridParams({
      ...baseContext,
      gridType: 'arithmetic',
    });

    expect(result.lower).toBeGreaterThan(0);
    expect(result.upper).toBeGreaterThan(result.lower);
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(result.count)).toBe(true);
  });

  it('should handle basic geometric grid calculation', () => {
    const result = computeOptimalGridParams({
      ...baseContext,
      gridType: 'geometric',
    });

    expect(result.lower).toBeGreaterThan(0);
    expect(result.upper).toBeGreaterThan(result.lower);
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(result.count)).toBe(true);
  });

  it('should handle edge case with very small spacing', () => {
    const result = computeOptimalGridParams({
      ...baseContext,
      atr: 0.00001, // Very small ATR
      feePercent: 0.001, // Small fee
      gridType: 'geometric',
    });

    expect(result.lower).toBeGreaterThan(0);
    expect(result.upper).toBeGreaterThan(result.lower);
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(result.count)).toBe(true);
  });

  it('should handle zero ATR gracefully', () => {
    const result = computeOptimalGridParams({
      ...baseContext,
      atr: 0,
      gridType: 'arithmetic',
    });

    expect(result.lower).toBeGreaterThan(0);
    expect(result.upper).toBeGreaterThan(result.lower);
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(result.count)).toBe(true);
  });

  it('should handle extreme currentPrice values', () => {
    const result = computeOptimalGridParams({
      ...baseContext,
      currentPrice: 0.000001, // Very small price
      atr: 0.0000001,
      gridType: 'arithmetic',
    });

    expect(result.lower).toBeGreaterThan(0);
    expect(result.upper).toBeGreaterThan(result.lower);
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(result.count)).toBe(true);
  });

  it('should handle custom buyPrice and sellPrice', () => {
    const result = computeOptimalGridParams({
      ...baseContext,
      buyPrice: 45000,
      sellPrice: 55000,
      gridType: 'arithmetic',
    });

    expect(result.lower).toBe(45000);
    expect(result.upper).toBe(55000);
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(result.count)).toBe(true);
  });

  it('should handle invalid custom range gracefully', () => {
    const result = computeOptimalGridParams({
      ...baseContext,
      buyPrice: 55000, // Higher than sell price
      sellPrice: 45000,
      gridType: 'arithmetic',
    });

    // Should fallback to default range around current price
    expect(result.lower).toBeGreaterThan(0);
    expect(result.upper).toBeGreaterThan(result.lower);
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(result.count)).toBe(true);
  });
});