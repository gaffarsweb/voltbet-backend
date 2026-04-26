import { Request, Response } from "express";
import mongoose from "mongoose";
import walletModel from "../../models/wallet.model";
import networkModel from "../../models/network.model";
import tokenModel from "../../models/token.model";

export const getWalletByNetworkUser = async (req: Request, res: Response) => {
    try {
        const userId = req?.user?._id || req?.user?.id;
        console.log("User ID:", userId);
        const { networkId, tokenSymbol } = req?.query;
        const network: any = await networkModel.findById(networkId);
        if (!network) {
            return res.status(400).json({
                message: "networkId  required",
            });
        }
        const token: any = await tokenModel.findOne({ tokenSymbol, networkId })
        if (!token) {
            return res.status(400).json({
                message: "tokenSymbol  required",
            });
        }
        let type = network?.type;
        if (!userId || !type) {
            return res.status(400).json({
                message: "userId and type required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId as string)) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        const wallet: any = await walletModel.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        let address: string | null = null;

        switch (type) {
            case "EVM":
                address = wallet?.address;
                break;

            case "TRON":
                address = wallet?.addressTron;
                break;

            case "SOLANA":
                address = wallet?.addressSolana;
                break;

            case "BTC":
                address = wallet?.addressBtc;
                break;

            default:
                return res.status(400).json({ message: "Invalid network type" });
        }

        return res.json({
            message: "Wallet fetched",
            data: {
                networkType: type,
                address,
                minDeposit: token?.minDeposit
            },
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};