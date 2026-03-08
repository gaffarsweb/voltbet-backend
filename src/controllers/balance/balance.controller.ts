import mongoose from "mongoose";
import walletModel from "../../models/wallet.model";
import { errorResponse, successResponse } from "../../utils/response";
import { Request, Response } from "express";

export const getBalance = async (req: Request, res: Response) => {
    const user = await walletModel.findOne({userId:new mongoose.Types.ObjectId(req?.user?.id)});
    if (!user) {
        return errorResponse(res, "Wallet not found");
    }
    return successResponse(res, "Balance fetched successfully", {
        balance: user.balance.toString(),
    });
};