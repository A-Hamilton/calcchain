// src/utils/atr.ts
import axios from 'axios';
import { BINANCE_API_BASE_URL, MINUTES_IN_DAY, DEFAULT_ATR_PERIOD } from '../constants';

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  time?: number; 
}

export async function fetchCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  const url = `${BINANCE_API_BASE_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  try {
    const response = await axios.get<any[][]>(url); 
    const rawData = response.data;

    if (!Array.isArray(rawData)) { // Binance might return error object instead of array for some invalid symbols
        if (rawData && (rawData as any).msg) {
             throw new Error(`Binance API Error: ${(rawData as any).msg} (Symbol: ${symbol})`);
        }
        throw new Error(`Unexpected data format from Binance API for symbol ${symbol}.`);
    }
    if (rawData.length === 0) {
      // This case might indicate a valid symbol but no data for the period, or an invalid symbol not caught by API error.
      throw new Error(`No candle data returned for symbol ${symbol}. It might be an invalid symbol or no data available for the requested period.`);
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
    let errorMessage = `Network error or issue fetching candles for ${symbol}.`;
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Binance often returns error details in response.data.msg
        const binanceErrorMsg = error.response.data?.msg;
        const binanceErrorCode = error.response.data?.code;
        if (binanceErrorMsg) {
          // Specific check for common invalid symbol messages
          if (binanceErrorMsg.toLowerCase().includes("invalid symbol") || binanceErrorCode === -1121) {
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
      // Catch errors re-thrown from above (e.g., "No candle data returned")
      errorMessage = error.message;
    }
    console.error(`Error in fetchCandles for ${symbol}:`, errorMessage, error);
    throw new Error(errorMessage); 
  }
}

export function computeAtr(candles: Candle[], period: number): number {
  if (!candles || candles.length < period + 1) {
    throw new Error(`Not enough candle data for ATR calculation. Need ${period + 1} candles, got ${candles.length}.`);
  }
  
  const trueRanges: number[] = [];
  for (let i = candles.length - period; i < candles.length; i++) {
    const currentCandle = candles[i];
    const previousCandle = candles[i-1]; 
    const highLow = currentCandle.high - currentCandle.low;
    const highPrevClose = Math.abs(currentCandle.high - previousCandle.close);
    const lowPrevClose = Math.abs(currentCandle.low - previousCandle.close);
    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }
  
  const sumOfTrueRanges = trueRanges.reduce((acc, tr) => acc + tr, 0);
  if (period === 0) return 0; 
  return sumOfTrueRanges / period;
}

export async function getAtr(symbol: string, interval: string, period: number = DEFAULT_ATR_PERIOD): Promise<number> {
  const candles = await fetchCandles(symbol, interval, period + 1); 
  return computeAtr(candles, period);
}

export async function getAtrPerMin(symbol: string, period: number = DEFAULT_ATR_PERIOD): Promise<number> {
  const dailyCandles = await fetchCandles(symbol, "1d", period + 1);
  const atr1d = computeAtr(dailyCandles, period);
  return atr1d / MINUTES_IN_DAY; 
}

