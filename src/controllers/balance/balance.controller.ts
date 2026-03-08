import mongoose from "mongoose";
import walletModel from "../../models/wallet.model";
import { errorResponse, successResponse } from "../../utils/response";
import { Request, Response } from "express";
import { redisClient } from "../../config/redis";

export const getBalance = async (req: Request, res: Response) => {
  const userId = req?.user?.id;

  const cacheKey = `balance:${userId}`;

  // 1️⃣ Check Redis first
  const cachedBalance = await redisClient.get(cacheKey);

  if (cachedBalance) {
    // console.log('it is in redis', cachedBalance)
    return successResponse(res, "Balance fetched from cache", {
      balance: cachedBalance,
    });
  }

  // 2️⃣ If not in cache → fetch from DB
  const user = await walletModel.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!user) {
    return errorResponse(res, "Wallet not found");
  }

  const balance = user.balance.toString();

  // 3️⃣ Store in Redis for 5 hours
  await redisClient.set(cacheKey, balance, {
    EX: 60 * 60 * 5, // 5 hours
  });

  return successResponse(res, "Balance fetched successfully", {
    balance,
  });
};