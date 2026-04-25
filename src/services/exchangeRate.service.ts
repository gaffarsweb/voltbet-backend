import { redisClient } from '../config/redis';
import { getBinanceApi } from './binanceApi';

// Redis keys for exchange rates
export const REDIS_KEY__BINANCE_ETH_USDT = 'binance:eth_usdt';
export const REDIS_KEY__BINANCE_BTC_USDT = 'binance:btc_usdt';
export const REDIS_KEY__BINANCE_TRX_USDT = 'binance:trx_usdt';
export const REDIS_KEY__BINANCE_SOL_USDT = 'binance:sol_usdt';
export const REDIS_KEY__BINANCE_USDC_USDT = 'binance:usdc_usdt';

// Symbols to fetch
const EXCHANGE_SYMBOLS = [
  { symbol: 'ETHUSDT', key: REDIS_KEY__BINANCE_ETH_USDT },
  { symbol: 'BTCUSDT', key: REDIS_KEY__BINANCE_BTC_USDT },
  { symbol: 'TRXUSDT', key: REDIS_KEY__BINANCE_TRX_USDT },
  { symbol: 'SOLUSDT', key: REDIS_KEY__BINANCE_SOL_USDT },
  { symbol: 'USDCUSDT', key: REDIS_KEY__BINANCE_USDC_USDT },
];

/**
 * Update exchange rates from Binance API
 * Should be called every minute via cron
 */
export async function updateBinanceExchangeRates(): Promise<void> {
  try {
    const binanceApi = getBinanceApi();

    // Fetch each symbol individually for better error handling
    await Promise.all(
      EXCHANGE_SYMBOLS.map(async ({ symbol, key }) => {
        try {
          const response = await binanceApi.symbolPriceTicker({ symbol });
          
          if (response?.price) {
            await redisClient.setex(key, 3600, response.price);
            console.log(`✅ Updated ${symbol}: ${response.price}`);
          }else{
            console.log('not found rate for', symbol);
          }
        } catch (err) {
          console.error(`Failed to fetch ${symbol}:`, err);
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
    'USDT': REDIS_KEY__BINANCE_USDC_USDT,
    'USDC': REDIS_KEY__BINANCE_USDC_USDT,
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