import mongoose from "mongoose";
import walletModel from "../models/wallet.model";
import networkModel from "../models/network.model";
import tokenModel from "../models/token.model";
import depositTransactionModel from "../models/depositTransaction.model";
import blockchainTransactionModel from "../models/blockchainTransaction.model";
import transactionModel from "../models/transaction.model";
import { redisClient } from "../config/redis";

// Currency enum mapping
export const CURRENCY_MAP: Record<string, number> = {
  'ETH': 0,
  'USDT': 1,
  'BTC': 2,
  'TRX': 3,
  'SOL': 4,
  'USDC': 5,
};

// Network to currency mapping
export const CURRENCY_MAP_NET: Record<string, number> = {
  'ethereum': 0,
  'polygon': 6,
  'bsc': 7,
  'base': 8,
  'optimism': 9,
  'arbitrum': 10,
  'avalanche': 11,
  'tron': 3,
  'solana': 4,
  'bitcoin': 2,
};

// Redis keys for exchange rates
const REDIS_KEY__BINANCE_ETH_USDT = 'binance:eth_usdt';
const REDIS_KEY__BINANCE_BTC_USDT = 'binance:btc_usdt';
const REDIS_KEY__BINANCE_TRX_USDT = 'binance:trx_usdt';
const REDIS_KEY__BINANCE_SOL_USDT = 'binance:sol_usdt';
const REDIS_KEY__BINANCE_USDC_USDT = 'binance:usdc_usdt';

export interface DetectedDeposit {
  txId: string;
  from: string;
  to: string;
  amount: number;
  blockNumber: number;
  timestamp: number;
  raw: any;
  dontCreateBlockChainLegdre?: boolean;
}

/**
 * Get USD exchange rate from Redis
 */
export async function getUsdRate(currency: string): Promise<number> {
  const keyMap: Record<string, string> = {
    'ETH': REDIS_KEY__BINANCE_ETH_USDT,
    'USDT': REDIS_KEY__BINANCE_USDC_USDT,
    'BTC': REDIS_KEY__BINANCE_BTC_USDT,
    'TRX': REDIS_KEY__BINANCE_TRX_USDT,
    'SOL': REDIS_KEY__BINANCE_SOL_USDT,
    'USDC': REDIS_KEY__BINANCE_USDC_USDT,
  };

  const redisKey = keyMap[currency.toUpperCase()];
  if (!redisKey) return 0;

  const rate = await redisClient.get(redisKey);
  return rate ? parseFloat(rate) : 0;
}

/**
 * Convert amount to USD and points
 */
export async function convertToUsdAndPoints(
  amount: number,
  currencyEnum: number
): Promise<{ usdAmount: string; pointsAmount: number }> {
  const currencyKeys = Object.entries(CURRENCY_MAP).find(([_, v]) => v === currencyEnum);
  const currency = currencyKeys?.[0] || 'USDT';
  
  const usdRate = await getUsdRate(currency);
  const usdAmount = (amount * usdRate).toFixed(2);
  
  // Points = USD amount (1 USD = 1 point)
  const pointsAmount = parseFloat(usdAmount);

  return { usdAmount, pointsAmount };
}

/**
 * Map network name to native currency
 */
export async function mapNetworkToNative(network: string): Promise<string> {
  const networkMap: Record<string, string> = {
    'ETH': 'ETH',
    'ETHEREUM': 'ETH',
    'POLYGON': 'MATIC',
    'BSC': 'BNB',
    'BASE': 'ETH',
    'OPTIMISM': 'ETH',
    'ARBITRUM': 'ETH',
    'AVALANCHE': 'AVAX',
    'TRON': 'TRX',
    'SOLANA': 'SOL',
    'BITCOIN': 'BTC',
  };

  return networkMap[network.toUpperCase()] || 'ETH';
}

/**
 * Process EVM deposit from Alchemy webhook
 */
export async function processEvmDeposit(payload: {
  userId: string;
  network: string;
  tx: any;
  wallet: any;
}): Promise<{ success: boolean; message: string }> {
  const { userId, network, tx, wallet } = payload;

  try {
    const txId = tx.hash;
    const from = (tx.fromAddress || tx.from || '').toLowerCase();
    const to = (tx.toAddress || tx.to || '').toLowerCase();

    if (!from || !to) {
      return { success: false, message: 'Missing from/to address' };
    }

    // Check for duplicate deposit
    const exists = await depositTransactionModel.findOne({ transactionId: txId });
    if (exists) {
      return { success: false, message: 'Duplicate transaction' };
    }

    // Check blockchain transaction
    const existsBlockchainTx = await blockchainTransactionModel.findOne({ txHash: txId });
    if (existsBlockchainTx) {
      return { success: false, message: 'Blockchain transaction exists' };
    }

    // Determine token type
    const isERC20 = tx.category === 'erc20' || tx.category === 'token';
    const isNative = tx.category === 'external' || tx.category === 'internal';

    let amount = 0;
    let currency = '';
    let token: any = null;

    if (isERC20) {
      const tokenAddress = (tx.log?.address || tx.rawContract?.address || '').toLowerCase();
      
      token = await tokenModel.findOne({ tokenAddress });
      if (!token) {
        return { success: false, message: 'Token not found' };
      }

      amount = Number(tx.value) || Number(tx.rawContract?.value || 0) / Math.pow(10, token.decimals);
      currency = token.tokenSymbol;
    } else if (isNative) {
      currency = await mapNetworkToNative(network);
      token = await tokenModel.findOne({ 
        tokenSymbol: currency,
        networkId: (await networkModel.findOne({ name: { $regex: new RegExp(network, 'i') } }))?._id
      });
      amount = Number(tx.value);
    }

    if (!amount || amount <= 0) {
      return { success: false, message: 'Invalid amount' };
    }

    // Get USD conversion
    const currencyEnum = CURRENCY_MAP[currency] ?? 1;
    const { usdAmount, pointsAmount } = await convertToUsdAndPoints(amount, currencyEnum);

    // Find network
    const foundNetwork = await networkModel.findOne({ 
      name: { $regex: new RegExp(network, 'i') } 
    });

    if (!foundNetwork) {
      return { success: false, message: 'Network not found' };
    }

    // Check min deposit
    if (token && amount < parseFloat(token.minDeposit)) {
      // Create pending blockchain transaction
      await blockchainTransactionModel.create({
        network: foundNetwork.name,
        chainId: foundNetwork.chainId,
        currency,
        tokenAddress: token.tokenAddress === 'NATIVE' ? null : token.tokenAddress,
        txHash: txId,
        blockNumber: BigInt(typeof tx.blockNum === 'string' ? parseInt(tx.blockNum, 16) : tx.blockNum),
        blockTime: BigInt(new Date(tx.blockTimestamp).getTime()),
        confirmations: 1,
        fromAddress: from,
        toAddress: to,
        amount: amount.toString(),
        fee: null,
        feeCurrency: null,
        type: 'USER_DEPOSIT',
        direction: 'IN',
        userId: new mongoose.Types.ObjectId(userId),
        status: 'PENDING',
        raw: tx,
      });

      // Check total pending
      const pendingSum = await blockchainTransactionModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), currency, status: 'PENDING' } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
      ]);

      const totalPending = pendingSum[0]?.total || 0;

      if (totalPending >= parseFloat(token.minDeposit)) {
        // Credit pending transactions
        await blockchainTransactionModel.updateMany(
          { userId: new mongoose.Types.ObjectId(userId), currency, status: 'PENDING' },
          { status: 'CREDITED' }
        );
      } else {
        return { success: true, message: 'Below min deposit, queued' };
      }
    }

    // Create deposit transaction
    const networkEnum = CURRENCY_MAP_NET[foundNetwork.name.toLowerCase()] || 0;
    
    const deposit = await depositTransactionModel.create({
      transactionId: txId,
      userId: new mongoose.Types.ObjectId(userId),
      currency: currencyEnum,
      amount: amount.toString(),
      usdAmount,
      status: 'success',
      sender: from,
      receiver: to,
      blockNumber: typeof tx.blockNum === 'string' ? parseInt(tx.blockNum, 16) : tx.blockNum,
      blockTimestamp: new Date(tx.blockTimestamp).getTime(),
      blockchain: networkEnum,
      network: foundNetwork.name,
      raw: tx,
    });

    // Create blockchain transaction
    await blockchainTransactionModel.create({
      network: foundNetwork.name,
      chainId: foundNetwork.chainId,
      currency,
      tokenAddress: token?.tokenAddress === 'NATIVE' ? null : token?.tokenAddress,
      txHash: txId,
      blockNumber: BigInt(typeof tx.blockNum === 'string' ? parseInt(tx.blockNum, 16) : tx.blockNum),
      blockTime: BigInt(new Date(tx.blockTimestamp).getTime()),
      confirmations: 1,
      fromAddress: from,
      toAddress: to,
      amount: amount.toString(),
      fee: null,
      feeCurrency: null,
      type: 'USER_DEPOSIT',
      direction: 'IN',
      userId: new mongoose.Types.ObjectId(userId),
      status: 'CREDITED',
      raw: tx,
    });

    // Update wallet balance
    const walletDoc = await walletModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (walletDoc) {
      const currentBalance = parseFloat(walletDoc.balance.toString()) || 0;
      const newBalance = currentBalance + pointsAmount;
      
      await walletModel.updateOne(
        { userId: new mongoose.Types.ObjectId(userId) },
        { balance: newBalance.toString() }
      );

      // Invalidate cache
      await redisClient.del(`balance:${userId}`);
    }

    // Create transaction record
    await transactionModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      referenceId: deposit._id.toString(),
      amount: mongoose.Types.Decimal128.fromString(pointsAmount.toString()),
      operationType: 'CREDIT',
      counterParty: 'DEPOSIT_SERVICE',
      status: 'SUCCESS',
      targetBalance: 'ACCOUNT_BALANCE',
      displayAmount: usdAmount,
      displayCurrency: 'USD',
      usdRate: 1,
      metadata: { txId, currency, amount, usdAmount },
    });

    return { 
      success: true, 
      message: `Deposit processed: ${amount} ${currency} ($${usdAmount} USD)` 
    };

  } catch (error) {
    console.error('Error processing EVM deposit:', error);
    return { success: false, message: 'Deposit processing failed' };
  }
}

/**
 * Get user address by network type
 */
export function getUserAddressByNetwork(wallet: any, networkName: string): string | null {
  const evmNetworks = ['Ethereum', 'Polygon', 'BSC', 'Base', 'Optimism', 'Arbitrum One', 'Avalanche'];
  
  if (evmNetworks.includes(networkName)) {
    return wallet?.address;
  } else if (networkName === 'Tron') {
    return wallet?.addressTron;
  } else if (networkName === 'Solana') {
    return wallet?.addressSolana;
  } else if (networkName === 'Bitcoin' || networkName === 'BTC') {
    return wallet?.addressBtc;
  }
  
  return wallet?.address;
}