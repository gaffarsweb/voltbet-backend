import { Wallet } from 'ethers';
import walletModel from '../models/wallet.model';
import mongoose from 'mongoose';

export const createWalletAddress =async (id:mongoose.Types.ObjectId) => {
    const wallet = await Wallet.createRandom();
    return await walletModel.create({
        userId: id,
        address: wallet?.address,
        addressPrivateKey: wallet?.privateKey
    })
};
export const getWalletAddress = async (userId: mongoose.Types.ObjectId) => {
    return await walletModel.findOne({  userId }).select('address _id');
}
