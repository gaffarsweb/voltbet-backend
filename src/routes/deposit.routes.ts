import express from "express";
import { processDeposit } from "../controllers/deposit.controller";

const router = express.Router();

// Process deposit from Alchemy webhook (public - no auth required)
router.post('/process', processDeposit);

export default router;