import express from "express";
import {
  createNetwork,
  getAllNetworks,
  getNetworkById,
  updateNetwork,
  deleteNetwork,
  createToken,
  getAllTokens,
  getTokenById,
  updateToken,
  deleteToken,
  getTokensByNetwork,
} from "../controllers/network/network.controller"

const router = express.Router();

router.post("/", createNetwork);
router.get("/", getAllNetworks);


// CRUD
router.post("/token/", createToken);
router.get("/tokens/", getAllTokens);
router.get("/token/:id", getTokenById);
router.put("/token/:id", updateToken);
router.delete("/token/:id", deleteToken);

router.get("/:id", getNetworkById);
router.put("/:id", updateNetwork);
router.delete("/:id", deleteNetwork);
// Custom
router.get("/token/network/:networkId", getTokensByNetwork);
export default router;