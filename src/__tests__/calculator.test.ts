import { describe, it, expect, vi } from 'vitest';
import { calculateGridProfit } from '../utils/calculator';
import { GridParameters, GridType, EntryType } from '../types';

// Mock the atr module
vi.mock('../utils/atr', () => ({
  getAtrPerMin: vi.fn().mockResolvedValue(0.5), // Mock ATR value
}));

describe('calculateGridProfit', () => {
  const baseParams: GridParameters = {
    symbol: 'BTCUSDT',
    principal: 10000,
    lowerBound: 45000,
    upperBound: 55000,
    gridCount: 10,
    leverage: 1,
    feePercent: 0.1,
    durationDays: 30,
    atrPerMin: 0.5,
    gridType: GridType.Arithmetic,
    entryType: EntryType.Long,
  };

  it('should calculate arithmetic grid profit correctly', async () => {
    const result = await calculateGridProfit(baseParams);

    expect(result.gridSpacing).toBeGreaterThan(0);
    expect(result.estimatedTradesPerDay).toBeGreaterThanOrEqual(0);
    expect(result.investmentPerGrid).toBe(1000); // 10000 / 10
    expect(result.netProfitPerGridTransaction).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.totalNetProfit)).toBe(true);
  });

  it('should calculate geometric grid profit correctly', async () => {
    const result = await calculateGridProfit({
      ...baseParams,
      gridType: GridType.Geometric,
    });

    expect(result.gridSpacing).toBeGreaterThan(1); // Ratio should be > 1
    expect(result.estimatedTradesPerDay).toBeGreaterThanOrEqual(0);
    expect(result.investmentPerGrid).toBe(1000);
    expect(Number.isFinite(result.totalNetProfit)).toBe(true);
  });

  it('should handle short position correctly', async () => {
    const result = await calculateGridProfit({
      ...baseParams,
      entryType: EntryType.Short,
      gridType: GridType.Geometric,
    });

    expect(result.gridSpacing).toBeGreaterThan(1);
    expect(Number.isFinite(result.grossProfitPerGrid)).toBe(true);
    expect(Number.isFinite(result.totalNetProfit)).toBe(true);
  });

  it('should handle zero ATR gracefully', async () => {
    const result = await calculateGridProfit({
      ...baseParams,
      atrPerMin: 0,
    });

    expect(result.estimatedTradesPerDay).toBe(0); // No trades with zero volatility
    expect(result.totalNetProfit).toBe(0);
    expect(Number.isFinite(result.totalNetProfit)).toBe(true);
  });

  it('should calculate buy/sell P&L when provided', async () => {
    const result = await calculateGridProfit({
      ...baseParams,
      buyPrice: 45000,
      sellPrice: 55000,
    });

    expect(result.principalReturnFromEntryExit).not.toBeNull();
    expect(result.overallTotalValue).not.toBeNull();
    expect(Number.isFinite(result.principalReturnFromEntryExit!)).toBe(true);
    expect(Number.isFinite(result.overallTotalValue!)).toBe(true);
  });

  it('should handle invalid grid parameters', async () => {
    await expect(
      calculateGridProfit({
        ...baseParams,
        upperBound: 40000, // Less than lower bound
      })
    ).rejects.toThrow('Upper bound must be greater than lower bound');
  });

  it('should handle negative principal', async () => {
    await expect(
      calculateGridProfit({
        ...baseParams,
        principal: -1000,
      })
    ).rejects.toThrow('Principal must be a positive number');
  });

  it('should handle invalid leverage', async () => {
    await expect(
      calculateGridProfit({
        ...baseParams,
        leverage: 0.5, // Less than 1
      })
    ).rejects.toThrow('Leverage must be a number greater than or equal to 1');
  });

  it('should handle geometric grid with zero lower bound', async () => {
    await expect(
      calculateGridProfit({
        ...baseParams,
        lowerBound: 0,
        gridType: GridType.Geometric,
      })
    ).rejects.toThrow('Lower bound must be positive for geometric grids');
  });

  it('should handle geometric grid with very close bounds', async () => {
    await expect(
      calculateGridProfit({
        ...baseParams,
        lowerBound: 50000,
        upperBound: 50000.001, // Very close to lower bound
        gridCount: 100, // Many grids
        gridType: GridType.Geometric,
      })
    ).rejects.toThrow(/ratio too close to 1/i);
  });
});