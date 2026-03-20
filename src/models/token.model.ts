import mongoose from "mongoose";

const networkTokenSchema = new mongoose.Schema(
  {
    networkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Network",
      required: true,
      index: true,
    },

    chainId: {
      type: Number,
      required: true,
    },

    tokenSymbol: {
      type: String,
      required: true,
      uppercase: true,
    },

    tokenAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    decimals: {
      type: Number,
      required: true,
    },

    image: {
      type: String,
      default: null,
    },

    // ⚠️ Decimal handling (IMPORTANT)
    minDeposit: { 
      type: String, // use string for precision
      required: true,
    },

    minWithdrawUsd: {
      type: String, // USD value
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 UNIQUE constraint like Prisma
networkTokenSchema.index(
  { chainId: 1, tokenAddress: 1 },
  { unique: true }
);

export default mongoose.model("NetworkToken", networkTokenSchema);