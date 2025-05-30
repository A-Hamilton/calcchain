// src/utils/atr.ts
import axios from 'axios';
import { BINANCE_API_BASE_URL, MINUTES_IN_DAY, DEFAULT_ATR_PERIOD } from '../constants';

// Stricter type for the raw candle data from Binance API
// [ OpenTime, Open, High, Low, Close, Volume, CloseTime, QuoteAssetVolume, NumberOfTrades, TakerBuyBaseAssetVolume, TakerBuyQuoteAssetVolume, Ignore ]
type BinanceRawCandle = [
  number, // Open time
  string, // Open
  string, // High
  string, // Low
  string, // Close
  string, // Volume
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string  // Ignore
];

// Interface for our processed candle data
export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // Made non-optional as it's always provided
  time: number;   // Made non-optional as it's always provided
}

// Fetches candle data from Binance API
export async function fetchCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  const url = `${BINANCE_API_BASE_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  try {
    // Use the stricter BinanceRawCandle type for the GET request
    const response = await axios.get<BinanceRawCandle[] | { msg: string; code: number }>(url);
    const rawData = response.data;

    // Check if Binance returned an error object instead of an array
    if (!Array.isArray(rawData)) {
      if (rawData && typeof rawData === 'object' && 'msg' in rawData && 'code' in rawData) { // Ensure 'code' also exists for stricter check
        throw new Error(`Binance API Error: ${rawData.msg} (Code: ${rawData.code}, Symbol: ${symbol})`);
      }
      // Log the unexpected data format for debugging before throwing
      console.error(`Unexpected data format from Binance API for symbol ${symbol}. Expected array, got:`, rawData);
      throw new Error(`Unexpected data format from Binance API for symbol ${symbol}. Expected array.`);
    }

    if (rawData.length === 0) {
      throw new Error(`No candle data returned for symbol ${symbol}. It might be an invalid symbol or no data available for the requested period.`);
    }

    // Map the raw candle data to our Candle interface
    return rawData.map((c: BinanceRawCandle): Candle => ({ // Explicit return type for clarity
      time: Number(c[0]),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
  } catch (error) {
    let errorMessage = `Network error or issue fetching candles for ${symbol}.`;
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Attempt to get more specific error details from Binance response
        const responseData = error.response.data as Partial<{ msg: string; code: number }>; // Type assertion
        const binanceErrorMsg = responseData?.msg;
        const binanceErrorCode = responseData?.code;

        if (binanceErrorMsg) {
          if (String(binanceErrorMsg).toLowerCase().includes("invalid symbol") || binanceErrorCode === -1121) {
            errorMessage = `Symbol '${symbol}' not found or invalid on Binance.`;
          } else {
            errorMessage = `Binance API Error: ${binanceErrorMsg} (Code: ${binanceErrorCode !== undefined ? binanceErrorCode : 'N/A'})`;
          }
        } else {
          errorMessage = `Binance API Error: Status ${error.response.status} for symbol ${symbol}. Response data might not contain typical error structure.`;
        }
      } else if (error.request) {
        errorMessage = `Network error: No response received for symbol ${symbol}. Check connection.`;
      }
      // If it's an Axios error but doesn't fit above, the initial errorMessage or a more generic one might be used.
    } else if (error instanceof Error) {
      errorMessage = error.message; // Catch errors re-thrown from above or other standard errors
    }
    // For non-Error types (rare but possible if something throws a non-Error)
    else if (typeof error === 'string') {
        errorMessage = error;
    }

    console.error(`Error in fetchCandles for ${symbol}:`, errorMessage, error); // Log the detailed original error object too
    throw new Error(errorMessage); // Re-throw with a consolidated or specific message
  }
}

// Computes Average True Range (ATR) from candle data
export function computeAtr(candles: Candle[], period: number): number {
  if (period <= 0) { // ATR period must be positive
    // console.warn(`ATR period must be positive. Received ${period}, returning 0.`);
    return 0; // Or throw an error: throw new Error("ATR period must be positive.");
  }
  if (!candles || candles.length < period + 1) { // Need 'period' TRs, so 'period + 1' candles
    // console.warn(`Not enough candle data for ATR calculation. Need ${period + 1} candles, got ${candles.length}. Returning 0.`);
    // Depending on desired behavior, you might throw or return a specific value like NaN or 0.
    // Throwing an error is often better for clearly signaling a problem.
    throw new Error(`Not enough candle data for ATR calculation. Need ${period + 1} candles, got ${candles.length}.`);
  }

  const trueRanges: number[] = [];
  // Iterate to calculate 'period' number of True Range values
  // We need to look back 'period' number of candles from the end for TR calculation.
  // The loop should go from (candles.length - period) up to (candles.length - 1) inclusive.
  for (let i = candles.length - period; i < candles.length; i++) {
    const currentCandle = candles[i];
    const previousCandle = candles[i - 1]; // Safe due to the length check above (candles[i-1] will exist)
    
    const highLow = currentCandle.high - currentCandle.low;
    const highPrevClose = Math.abs(currentCandle.high - previousCandle.close);
    const lowPrevClose = Math.abs(currentCandle.low - previousCandle.close);
    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }

  // This check is defensive; given period > 0 and enough candles, trueRanges should not be empty.
  if (trueRanges.length === 0) return 0; 

  const sumOfTrueRanges = trueRanges.reduce((acc, tr) => acc + tr, 0);
  return sumOfTrueRanges / period; // period is guaranteed > 0 here
}

// Fetches candles and computes ATR for a given interval
export async function getAtr(symbol: string, interval: string, period: number = DEFAULT_ATR_PERIOD): Promise<number> {
  if (period <= 0) {
      // Consider throwing an error or returning a specific value like NaN
      // console.warn(`ATR period must be positive for getAtr. Received ${period}.`);
      throw new Error("ATR period must be positive.");
  }
  // Fetch period + 1 candles to have 'period' number of TRs
  const candles = await fetchCandles(symbol, interval, period + 1);
  return computeAtr(candles, period);
}

// Fetches daily candles and computes ATR per minute
export async function getAtrPerMin(symbol: string, period: number = DEFAULT_ATR_PERIOD): Promise<number> {
  if (period <= 0) {
      // console.warn(`ATR period must be positive for getAtrPerMin. Received ${period}.`);
      throw new Error("ATR period must be positive.");
  }
  // Fetch period + 1 daily candles
  const dailyCandles = await fetchCandles(symbol, "1d", period + 1);
  const atr1d = computeAtr(dailyCandles, period);
  if (MINUTES_IN_DAY <= 0) { // Defensive check for MINUTES_IN_DAY constant
      console.error("MINUTES_IN_DAY constant is not positive, cannot calculate ATR per minute.");
      throw new Error("Invalid MINUTES_IN_DAY configuration.");
  }
  return atr1d / MINUTES_IN_DAY;
}