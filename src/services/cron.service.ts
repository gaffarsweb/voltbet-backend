import { updateBinanceExchangeRates } from './exchangeRate.service';

/**
 * Cron job scheduler for exchange rate updates
 * Runs every minute to fetch latest rates from Binance
 */
let exchangeRateInterval: NodeJS.Timeout | null = null;

/**
 * Start the exchange rate cron job
 */
export function startExchangeRateCron(): void {
  if (exchangeRateInterval) {
    console.log('Exchange rate cron already running');
    return;
  }

  // Initial fetch
  updateBinanceExchangeRates().catch(console.error);

  // Update every minute
  exchangeRateInterval = setInterval(() => {
    updateBinanceExchangeRates().catch(console.error);
  }, 60 * 1000); // 1 minute

  console.log('✅ Exchange rate cron started (every minute)');
}

/**
 * Stop the exchange rate cron job
 */
export function stopExchangeRateCron(): void {
  if (exchangeRateInterval) {
    clearInterval(exchangeRateInterval);
    exchangeRateInterval = null;
    console.log('Exchange rate cron stopped');
  }
}