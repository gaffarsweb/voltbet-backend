import { Request, Response } from "express";
import networkModel from "../../models/network.model";
import { successResponse } from "../../utils/response";
import tokenModel from "../../models/token.model";


export const getAllNetworks = async (req: Request, res: Response) => {
  try {
    const networks = await networkModel.find().sort({ createdAt: -1 });

    return successResponse(res, "All networks fetched", {
      networks,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const createNetwork = async (req: Request, res: Response) => {
  try {
    const {
      name,
      rpc,
      currency,
      image,
      chainId,
      explorer,
      type,
      alchemyNetwork,
    } = req.body;

    const network = await networkModel.create({
      name,
      rpc,
      currency,
      image,
      chainId,
      explorer,
      type,
      alchemyNetwork,
    });

    return successResponse(res, "Network created", { network });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getNetworkById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const network = await networkModel.findById(id);

    if (!network) {
      return res.status(404).json({ message: "Network not found" });
    }

    return successResponse(res, "Network fetched", { network });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateNetwork = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updatedNetwork = await networkModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedNetwork) {
      return res.status(404).json({ message: "Network not found" });
    }

    return successResponse(res, "Network updated", {
      network: updatedNetwork,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteNetwork = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await networkModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Network not found" });
    }

    return successResponse(res, "Network deleted", {});
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};



export const createToken = async (req: Request, res: Response) => {
  try {
    const {
      networkId,
      chainId,
      tokenSymbol,
      tokenAddress,
      decimals,
      image,
      minDeposit,
      minWithdrawUsd,
    } = req.body;

    // ✅ Check network exists
    const network = await networkModel.findById(networkId);
    if (!network) {
      return res.status(404).json({ message: "Network not found" });
    }

    // ✅ Prevent duplicate token
    const existing = await tokenModel.findOne({
      chainId,
      tokenAddress: tokenAddress.toLowerCase(),
    });

    if (existing) {
      return res.status(400).json({ message: "Token already exists" });
    }

    const token = await tokenModel.create({
      networkId,
      chainId,
      tokenSymbol,
      tokenAddress: tokenAddress.toLowerCase(),
      decimals,
      image,
      minDeposit,
      minWithdrawUsd,
    });

    return successResponse(res, "Token created", { token });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllTokens = async (req: Request, res: Response) => {
  try {
    console.log(' it is called')
    const tokens = await tokenModel
      .find()
      .populate("networkId")
      .sort({ createdAt: -1 });

    return successResponse(res, "All tokens fetched", { tokens });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getTokensByNetwork = async (req: Request, res: Response) => {
  try {
    const { networkId } = req.params;

    const tokens = await tokenModel
      .find({ networkId })
      .sort({ createdAt: -1 });

    return successResponse(res, "Tokens fetched", { tokens });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getTokenById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const token = await tokenModel
      .findById(id)
      .populate("networkId");

    if (!token) {
      return res.status(404).json({ message: "Token not found" });
    }

    return successResponse(res, "Token fetched", { token });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateToken = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (req.body.tokenAddress) {
      req.body.tokenAddress = req.body.tokenAddress.toLowerCase();
    }

    const updatedToken = await tokenModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedToken) {
      return res.status(404).json({ message: "Token not found" });
    }

    return successResponse(res, "Token updated", {
      token: updatedToken,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteToken = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await tokenModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Token not found" });
    }

    return successResponse(res, "Token deleted", {});
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};