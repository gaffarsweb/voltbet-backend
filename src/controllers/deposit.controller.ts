import { Request, Response } from 'express';
import { processEvmDeposit } from '../services/deposit.service';
import walletModel from '../models/wallet.model';

/**
 * Process a deposit from Alchemy webhook (public endpoint)
 * Gets userId by matching the 'to' address in the wallet
 */
export async function processDeposit(req: Request, res: Response) {
    try {
        console.log('Processing deposit with request body:', req.body);
        
        // Extract data from Alchemy webhook payload
        const activity = req.body?.event?.activity?.[0] || {};
        console.log('Extracted activity:', activity);
        const { hash, fromAddress, toAddress, value, asset, category, rawContract, blockNum, blockTimestamp } = activity;
        const network = req.body?.event?.network;

        if (!toAddress) {
            return res.status(400).json({ success: false, message: 'Missing "to" address' });
        }

        const toAddr = toAddress.toLowerCase();

        // Find wallet by matching the 'to' address
        const wallet = await walletModel.findOne({
            $or: [
                { address: { $regex: new RegExp(`^${toAddr}$`, 'i') } },
                { addressTron: { $regex: new RegExp(`^${toAddr}$`, 'i') } },
                { addressSolana: { $regex: new RegExp(`^${toAddr}$`, 'i') } },
                { addressBtc: { $regex: new RegExp(`^${toAddr}$`, 'i') } },
            ]
        });

        console.log('Found wallet:', wallet ? `UserId: ${wallet.userId}, Address: ${wallet.address}` : 'NOT FOUND');

        if (!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found for address: ' + toAddress });
        }

        // Convert hex timestamp to date
        const timestampHex = blockTimestamp ? parseInt(blockTimestamp, 16) : null;
        const blockTime = timestampHex ? new Date(timestampHex * 1000).toISOString() : new Date().toISOString();

        // Build tx object from request
        const tx = {
            hash: hash,
            fromAddress: fromAddress,
            toAddress: toAddress,
            value: value,
            category: category || 'external',
            rawContract: rawContract,
            blockNum: blockNum || '0x0',
            blockTimestamp: blockTime,
        };

        console.log('Processing deposit for user:', wallet.userId, 'network:', network, 'tx:', tx);

        // Map network: ETH_MAINNET -> ethereum
        const networkName = network?.replace('_MAINNET', '').toLowerCase() || 'ethereum';
        console.log('Mapped network:', networkName);

        const result = await processEvmDeposit({
            userId: wallet.userId.toString(),
            network: networkName,
            tx,
            wallet,
        });

        console.log('Deposit result:', result);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in processDeposit:', error);
        return res.status(500).json({ success: false, message: 'Deposit processing failed' });
    }
}