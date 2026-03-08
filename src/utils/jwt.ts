import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET || "default_access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";

export const generateAccessToken = (payload: any) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: "5d",
  });
};

export const generateRefreshToken = (payload: any) => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};