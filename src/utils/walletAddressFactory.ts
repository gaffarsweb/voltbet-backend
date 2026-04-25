import { Wallet } from 'ethers';
import walletModel from '../models/wallet.model';
import networkModel from '../models/network.model';
import mongoose from 'mongoose';
import { AlchemyWebhookService } from '../services/alchemyWebhook.service';

export const createWalletAddress = async (id: mongoose.Types.ObjectId) => {
    const wallet = await Wallet.createRandom();
    const createdWallet = await walletModel.create({
        userId: id,
        address: wallet?.address,
        addressPrivateKey: wallet?.privateKey
    });

    // Assign address to Alchemy webhook for deposit monitoring
    try {
        // Find EVM network to assign webhook
        const network = await networkModel.findOne({ type: 'EVM' });
        if (network) {
            await AlchemyWebhookService.assignAddress(
                network._id.toString(),
                createdWallet.address
            );
            console.log(`✅ Wallet address ${createdWallet.address} assigned to Alchemy webhook`);
        }
    } catch (err) {
        // Log error but don't fail wallet creation
        console.error('Failed to assign wallet address to Alchemy webhook:', err);
    }

    return createdWallet;
};

export const getWalletAddress = async (userId: mongoose.Types.ObjectId) => {
    return await walletModel.findOne({  userId }).select('address _id');
}
