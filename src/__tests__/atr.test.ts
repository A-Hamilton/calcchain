import { describe, it, expect } from 'vitest';
import { computeAtr, Candle } from '../utils/atr';

describe('computeAtr', () => {
  const mockCandles: Candle[] = [
    { time: 1, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
    { time: 2, open: 102, high: 108, low: 100, close: 106, volume: 1200 },
    { time: 3, open: 106, high: 110, low: 104, close: 108, volume: 1100 },
    { time: 4, open: 108, high: 112, low: 106, close: 110, volume: 1300 },
    { time: 5, open: 110, high: 115, low: 108, close: 112, volume: 1400 },
  ];

  it('should calculate ATR correctly with valid data', () => {
    const atr = computeAtr(mockCandles, 3);
    
    expect(atr).toBeGreaterThan(0);
    expect(Number.isFinite(atr)).toBe(true);
  });

  it('should throw error with insufficient candles', () => {
    expect(() => {
      computeAtr(mockCandles.slice(0, 2), 3); // Only 2 candles for period 3
    }).toThrow('Not enough candle data for ATR calculation');
  });

  it('should throw error with invalid period', () => {
    expect(() => {
      computeAtr(mockCandles, 0);
    }).toThrow();
    
    expect(() => {
      computeAtr(mockCandles, -1);
    }).toThrow();
  });

  it('should handle edge case with identical prices', () => {
    const identicalCandles: Candle[] = [
      { time: 1, open: 100, high: 100, low: 100, close: 100, volume: 1000 },
      { time: 2, open: 100, high: 100, low: 100, close: 100, volume: 1000 },
      { time: 3, open: 100, high: 100, low: 100, close: 100, volume: 1000 },
    ];
    
    const atr = computeAtr(identicalCandles, 2);
    expect(atr).toBe(0); // Should be 0 for no volatility
    expect(Number.isFinite(atr)).toBe(true);
  });

  it('should handle candles with extreme values', () => {
    const extremeCandles: Candle[] = [
      { time: 1, open: 0.000001, high: 0.000002, low: 0.0000005, close: 0.0000015, volume: 1000 },
      { time: 2, open: 0.0000015, high: 0.000003, low: 0.000001, close: 0.0000025, volume: 1000 },
      { time: 3, open: 0.0000025, high: 0.000004, low: 0.000002, close: 0.0000035, volume: 1000 },
    ];
    
    const atr = computeAtr(extremeCandles, 2);
    expect(atr).toBeGreaterThan(0);
    expect(Number.isFinite(atr)).toBe(true);
  });

  it('should validate True Range calculations for invalid data', () => {
    const invalidCandles: Candle[] = [
      { time: 1, open: 100, high: 105, low: 95, close: 102, volume: 1000 }, // Valid previous candle
      { time: 2, open: 102, high: 90, low: 105, close: 106, volume: 1200 }, // High < Low (invalid)
    ];
    
    // This should throw an error during ATR calculation
    expect(() => {
      computeAtr(invalidCandles, 1);
    }).toThrow(/high.*is less than low/i);
  });
});