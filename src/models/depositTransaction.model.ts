import mongoose from "mongoose";

const depositTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    currency: {
      type: Number,
      required: true,
    },

    amount: {
      type: String,
      required: true,
    },

    usdAmount: {
      type: String,
      default: "0",
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    sender: {
      type: String,
      required: true,
    },

    receiver: {
      type: String,
      required: true,
    },

    blockNumber: {
      type: Number,
      default: 0,
    },

    blockTimestamp: {
      type: Number,
      default: 0,
    },

    blockchain: {
      type: Number,
      required: true,
    },

    network: {
      type: String,
      default: null,
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

export default mongoose.model("DepositTransaction", depositTransactionSchema);