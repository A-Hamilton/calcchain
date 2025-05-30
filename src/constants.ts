// src/constants.ts

/**
 * Number of minutes in a standard day.
 */
export const MINUTES_IN_DAY = 1440;

/**
 * Default percentage range (e.g., 0.05 for ±5%) around the current price 
 * used by the optimizer if specific buy/sell prices are not provided.
 */
export const DEFAULT_PRICE_RANGE_PERCENTAGE = 0.05;

/**
 * Safety buffer percentage (e.g., 0.002 for 0.2%) added to trading fees 
 * by the optimizer to ensure grid spacing is profitable.
 */
export const FEE_SAFETY_BUFFER_PERCENTAGE = 0.002;

/**
 * Base URL for the Binance API Klines endpoint.
 */
export const BINANCE_API_BASE_URL = "https://api.binance.com/api/v3/klines"; // Ensure 'export' is here

/**
 * Default ATR (Average True Range) period used in calculations if not specified.
 * A common period for daily ATR.
 */
export const DEFAULT_ATR_PERIOD = 14;

// Add any other application-wide constants here.
