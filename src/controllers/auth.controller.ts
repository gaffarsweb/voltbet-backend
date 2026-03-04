import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { successResponse, errorResponse } from "../utils/response";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return errorResponse(res, "Please provide all fields");
  }
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return errorResponse(res, "Username or email already exists");
  }


  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashed,
  });

  // const token = generateToken(user._id.toString());
  const accessToken = generateAccessToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  return successResponse(res, "User registered successfully", {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      balance: user.balance,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user: any = await User.findOne({ username });

  if (!user) return errorResponse(res, "User not found");

  const match = await bcrypt.compare(password, user.password);

  if (!match) return errorResponse(res, "Wrong password");

  const accessToken = generateAccessToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  return successResponse(res, "Login successful", {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      balance: user.balance,
    },
  });
};

export const getMe = async (req: any, res: Response) => {
  const user = await User.findById(req.user.id);

  return successResponse(res, "User fetched successfully", {
    user: {
      id: user?._id,
      username: user?.username,
      balance: user?.balance,
    },
  });
};