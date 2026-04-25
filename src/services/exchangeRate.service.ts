import { redisClient } from '../config/redis';
import { getBinanceApi } from './binanceApi';

// Redis keys for exchange rates
export const REDIS_KEY__BINANCE_ETH_USDT = 'binance:eth_usdt';
export const REDIS_KEY__BINANCE_BTC_USDT = 'binance:btc_usdt';
export const REDIS_KEY__BINANCE_TRX_USDT = 'binance:trx_usdt';
export const REDIS_KEY__BINANCE_SOL_USDT = 'binance:sol_usdt';
export const REDIS_KEY__BINANCE_USDC_USDT = 'binance:usdc_usdt';
export const REDIS_KEY__BINANCE_ETH_USDC = 'binance:eth_usdc';
export const REDIS_KEY__BINANCE_BTC_USDC = 'binance:btc_usdc';
export const REDIS_KEY__BINANCE_TRX_USDC = 'binance:trx_usdc';
export const REDIS_KEY__BINANCE_SOL_USDC = 'binance:sol_usdc';

// Symbols to fetch in one API call
const SYMBOLS_TO_FETCH = '["SOLUSDT","ETHUSDT","TRXUSDT","BTCUSDT","SOLUSDC","ETHUSDC","TRXUSDC","BTCUSDC"]';

/**
 * Update exchange rates from Binance API (single API call)
 * Should be called every minute via cron
 */
export async function updateBinanceExchangeRates(): Promise<void> {
  try {
    const binanceApi = getBinanceApi();

    // Single API call for all symbols
    const binanceResponse = await binanceApi.symbolPriceTicker({
      symbols: SYMBOLS_TO_FETCH,
    });

    if (!binanceResponse?.length) {
      console.log('No exchange rates received from Binance');
      return;
    }

    // Process all responses
    await Promise.all(
      binanceResponse.map(async (curr) => {
        try {
          let key: string | null = null;

          if (curr.symbol === 'SOLUSDT') {
            key = REDIS_KEY__BINANCE_SOL_USDT;
          } else if (curr.symbol === 'ETHUSDT') {
            key = REDIS_KEY__BINANCE_ETH_USDT;
          } else if (curr.symbol === 'TRXUSDT') {
            key = REDIS_KEY__BINANCE_TRX_USDT;
          } else if (curr.symbol === 'BTCUSDT') {
            key = REDIS_KEY__BINANCE_BTC_USDT;
          } else if (curr.symbol === 'SOLUSDC') {
            key = REDIS_KEY__BINANCE_SOL_USDC;
          } else if (curr.symbol === 'ETHUSDC') {
            key = REDIS_KEY__BINANCE_ETH_USDC;
          } else if (curr.symbol === 'TRXUSDC') {
            key = REDIS_KEY__BINANCE_TRX_USDC;
          } else if (curr.symbol === 'BTCUSDC') {
            key = REDIS_KEY__BINANCE_BTC_USDC;
          }

          if (key) {
            // Use redis v4 setex method
            await redisClient.setEx(key, 3600, curr.price);
            console.log(`✅ Updated ${curr.symbol}: ${curr.price}`);
          }
        } catch (err) {
          console.error(`Failed to store ${curr.symbol}:`, err);
        }
      })
    );

    console.log('✅ Exchange rates updated successfully');
  } catch (error) {
    console.error('Failed to update exchange rates:', error);
  }
}

/**
 * Get exchange rate for a currency
 */
export async function getExchangeRate(currency: string): Promise<number> {
  const keyMap: Record<string, string> = {
    'ETH': REDIS_KEY__BINANCE_ETH_USDT,
    'USDT': REDIS_KEY__BINANCE_ETH_USDT,
    'USDC': REDIS_KEY__BINANCE_ETH_USDC,
    'BTC': REDIS_KEY__BINANCE_BTC_USDT,
    'TRX': REDIS_KEY__BINANCE_TRX_USDT,
    'SOL': REDIS_KEY__BINANCE_SOL_USDT,
  };

  const key = keyMap[currency.toUpperCase()];
  if (!key) return 0;

  const rate = await redisClient.get(key);
  return rate ? parseFloat(rate) : 0;
}

/**
 * Convert crypto amount to USD
 */
export async function convertToUsd(currency: string, amount: number): Promise<number> {
  const rate = await getExchangeRate(currency);
  return amount * rate;
}