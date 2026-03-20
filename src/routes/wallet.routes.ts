import express from "express";
import { getWalletByNetworkUser } from "../controllers/wallet/wallet.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.get('/', protect, getWalletByNetworkUser)

export default router