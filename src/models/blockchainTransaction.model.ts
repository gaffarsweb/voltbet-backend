import mongoose from "mongoose";

const blockchainTransactionSchema = new mongoose.Schema(
  {
    network: {
      type: String,
      required: true,
      index: true,
    },

    chainId: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      required: true,
      index: true,
    },

    tokenAddress: {
      type: String,
      default: null,
    },

    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    blockNumber: {
      type: mongoose.Schema.Types.BigInt,
      default: 0,
    },

    blockTime: {
      type: mongoose.Schema.Types.BigInt,
      default: 0,
    },

    confirmations: {
      type: Number,
      default: 0,
    },

    fromAddress: {
      type: String,
      required: true,
      lowercase: true,
    },

    toAddress: {
      type: String,
      required: true,
      lowercase: true,
    },

    amount: {
      type: String,
      required: true,
    },

    fee: {
      type: String,
      default: null,
    },

    feeCurrency: {
      type: String,
      default: null,
    },

    type: {
      type: String,
      enum: ["USER_DEPOSIT", "USER_WITHDRAWAL", "FEE", "INTERNAL"],
      required: true,
    },

    direction: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "CREDITED", "CONFIRMED", "FAILED"],
      default: "PENDING",
    },

    raw: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying user transactions
blockchainTransactionSchema.index(
  { userId: 1, currency: 1, network: 1, status: 1 },
  { name: "user_tx_idx" }
);

export default mongoose.model("BlockchainTransaction", blockchainTransactionSchema);