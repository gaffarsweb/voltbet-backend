import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referenceId: {
      type: String,
      required: true,
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },

    operationType: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    counterParty: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    targetBalance: {
      type: String,
      enum: ["ACCOUNT_BALANCE", "BONUS_BALANCE"],
      required: true,
    },

    bonusMoneyPrevious: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
    },

    realMoneyPrevious: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
    },

    displayAmount: {
      type: String,
      default: "0",
    },

    displayCurrency: {
      type: String,
      default: "",
    },

    usdRate: {
      type: Number,
      default: 0,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying user transactions
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ referenceId: 1 });

export default mongoose.model("Transaction", transactionSchema);