import express from "express";
import { protect } from "../middleware/auth.middleware";
import { getBalance } from "../controllers/balance/balance.controller";

const router = express.Router();

// router.post("/register", register);
// router.post("/login", login);
router.get("/", protect, getBalance);

export default router;