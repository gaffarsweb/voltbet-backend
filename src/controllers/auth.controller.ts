import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
};

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashed,
  });

  const token = generateToken(user._id.toString());

  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      balance: user.balance,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user:any = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

  const token = generateToken(user._id.toString());

  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      balance: user.balance,
    },
  });
};

export const getMe = async (req: any, res: Response) => {
  const user = await User.findById(req.user.id);

  res.json({
    user: {
      id: user?._id,
      username: user?.username,
      balance: user?.balance,
    },
  });
};