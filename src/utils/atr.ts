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
  volume?: number;
  time?: number;
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
      if (rawData && typeof rawData === 'object' && 'msg' in rawData) {
        throw new Error(`Binance API Error: ${rawData.msg} (Code: ${rawData.code}, Symbol: ${symbol})`);
      }
      throw new Error(`Unexpected data format from Binance API for symbol ${symbol}. Expected array.`);
    }

    if (rawData.length === 0) {
      throw new Error(`No candle data returned for symbol ${symbol}. It might be an invalid symbol or no data available for the requested period.`);
    }

    // Map the raw candle data to our Candle interface
    return rawData.map((c: BinanceRawCandle) => ({
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
        const binanceErrorMsg = error.response.data?.msg;
        const binanceErrorCode = error.response.data?.code;
        if (binanceErrorMsg) {
          if (String(binanceErrorMsg).toLowerCase().includes("invalid symbol") || binanceErrorCode === -1121) {
            errorMessage = `Symbol '${symbol}' not found or invalid on Binance.`;
          } else {
            errorMessage = `Binance API Error: ${binanceErrorMsg} (Code: ${binanceErrorCode || 'N/A'})`;
          }
        } else {
          errorMessage = `Binance API Error: Status ${error.response.status} for symbol ${symbol}.`;
        }
      } else if (error.request) {
        errorMessage = `Network error: No response received for symbol ${symbol}. Check connection.`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message; // Catch errors re-thrown from above
    }
    console.error(`Error in fetchCandles for ${symbol}:`, errorMessage, error);
    throw new Error(errorMessage);
  }
}

// Computes Average True Range (ATR) from candle data
export function computeAtr(candles: Candle[], period: number): number {
  if (!candles || candles.length < period + 1) { // Need 'period' TRs, so 'period + 1' candles
    throw new Error(`Not enough candle data for ATR calculation. Need ${period + 1} candles, got ${candles.length}.`);
  }

  const trueRanges: number[] = [];
  // Iterate to calculate 'period' number of True Range values
  // Start from index 1 to access previous candle at candles[i-1]
  // We need to look back 'period' number of candles from the end for TR calculation
  // Example: If period is 14, and candles.length is 15 (indices 0-14)
  // We calculate TR for candles[1] to candles[14] using candles[0] to candles[13] as previous.
  // The loop should go from (candles.length - period) up to (candles.length - 1)
  for (let i = candles.length - period; i < candles.length; i++) {
    const currentCandle = candles[i];
    const previousCandle = candles[i - 1]; // This is why we need at least period + 1 candles
    
    const highLow = currentCandle.high - currentCandle.low;
    const highPrevClose = Math.abs(currentCandle.high - previousCandle.close);
    const lowPrevClose = Math.abs(currentCandle.low - previousCandle.close);
    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }

  if (trueRanges.length === 0) return 0; // Should not happen if period > 0 and enough candles

  const sumOfTrueRanges = trueRanges.reduce((acc, tr) => acc + tr, 0);
  if (period === 0) return 0; // Avoid division by zero
  return sumOfTrueRanges / period;
}

// Fetches candles and computes ATR for a given interval
export async function getAtr(symbol: string, interval: string, period: number = DEFAULT_ATR_PERIOD): Promise<number> {
  // Fetch period + 1 candles to have 'period' number of TRs
  const candles = await fetchCandles(symbol, interval, period + 1);
  return computeAtr(candles, period);
}

// Fetches daily candles and computes ATR per minute
export async function getAtrPerMin(symbol: string, period: number = DEFAULT_ATR_PERIOD): Promise<number> {
  // Fetch period + 1 daily candles
  const dailyCandles = await fetchCandles(symbol, "1d", period + 1);
  const atr1d = computeAtr(dailyCandles, period);
  return atr1d / MINUTES_IN_DAY;
}
