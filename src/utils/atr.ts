// src/utils/atr.ts

/**
 * Represents a single candle (OHLCV) from an exchange.
 */
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time?: number; // Binance kline open time
}

const BINANCE_API_BASE_URL = "https://api.binance.com/api/v3/klines";
const MINUTES_IN_DAY = 1440;

/**
 * Fetches historical candle data from Binance API.
 * @param symbol - Trading pair symbol, e.g. 'BTCUSDT'
 * @param interval - Candle interval, e.g. '1m', '1d'
 * @param limit - How many candles to fetch
 * @returns Array of Candle objects
 * @throws Error if API request fails or returns unexpected data
 */
export async function fetchCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  const url = `${BINANCE_API_BASE_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Try to parse error message from Binance if available
      let errorMsg = `Failed to fetch candles. Status: ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData && errorData.msg) {
          errorMsg = `Binance API Error: ${errorData.msg} (Symbol: ${symbol}, Interval: ${interval})`;
        }
      } catch (parseError) {
        // Ignore if response is not JSON
      }
      throw new Error(errorMsg);
    }
    const rawData = await res.json();

    if (!Array.isArray(rawData) || rawData.length === 0) {
        // Handle cases where API returns success but empty or malformed data
        // This can happen for invalid symbols that don't throw a 4xx error immediately
        throw new Error(`No candle data returned for symbol ${symbol}. It might be an invalid symbol or pair.`);
    }

    return rawData.map((c: any[]) => ({
      time: Number(c[0]),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
  } catch (error) {
    // Log the error and rethrow or handle as appropriate
    console.error(`Error fetching candles for ${symbol}:`, error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

/**
 * Computes the ATR (Average True Range) over a period from a candle array.
 * @param candles - Array of candles (ordered from oldest to newest, most recent last)
 * @param period - Number of periods to compute ATR over (must be < candles.length)
 * @returns The ATR value
 * @throws Error if not enough candle data for the given period
 */
export function computeAtr(candles: Candle[], period: number): number {
  if (!candles || candles.length < period + 1) { // Need at least period + 1 candles for 'period' TRs
    throw new Error(`Not enough candle data for ATR calculation. Need ${period + 1}, got ${candles.length}.`);
  }
  
  const trueRanges: number[] = [];
  // Iterate from the (period)-th candle from the end up to the most recent candle
  // to calculate 'period' number of True Range values.
  // Example: if period is 14, and candles has 20 items (indices 0-19)
  // We need candles[i-1] and candles[i].
  // Loop from candles.length - period up to candles.length - 1
  // This means we are looking at candles from index (candles.length - period - 1) as previous
  // and candles from index (candles.length - period) as current.
  for (let i = candles.length - period; i < candles.length; i++) {
    const currentCandle = candles[i];
    const previousCandle = candles[i-1]; // The candle before the current one in the loop

    const highLow = currentCandle.high - currentCandle.low;
    const highPrevClose = Math.abs(currentCandle.high - previousCandle.close);
    const lowPrevClose = Math.abs(currentCandle.low - previousCandle.close);
    
    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }
  
  const sumOfTrueRanges = trueRanges.reduce((acc, tr) => acc + tr, 0);
  return sumOfTrueRanges / period;
}


/**
 * Fetches ATR for a symbol at given interval and period.
 * @param symbol - E.g. 'BTCUSDT'
 * @param interval - E.g. '1m', '1d'
 * @param period - E.g. 14, 200
 * @returns The ATR value for the specified interval
 */
export async function getAtr(symbol: string, interval: string, period: number): Promise<number> {
  // Fetch period + 1 candles to have enough data for 'period' TR calculations
  const candles = await fetchCandles(symbol, interval, period + 1); 
  return computeAtr(candles, period);
}

/**
 * Gets an estimated ATR per minute, typically derived from daily volatility.
 * This provides a smoothed per-minute ATR value.
 * @param symbol - Trading pair symbol
 * @param period - ATR period for daily candles, defaults to 14
 * @returns Estimated ATR per minute
 */
export async function getAtrPerMin(symbol: string, period: number = 14): Promise<number> {
  // Fetch daily candles. Need 'period + 1' candles for 'period' TRs.
  const dailyCandles = await fetchCandles(symbol, "1d", period + 1);
  const atr1d = computeAtr(dailyCandles, period);
  return atr1d / MINUTES_IN_DAY; 
}
