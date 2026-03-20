import mongoose from "mongoose";

const networkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rpc: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    chainId: {
      type: Number,
      required: true,
      index: true,
    },
    explorer: {
      type: String,
      default: null,
    },

    // NEW FIELDS
    type: {
      type: String,
      required: true, // EVM | SOLANA | TRON | SUI
      index: true,
    },
    alchemyNetwork: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt auto
  }
);

export default mongoose.model("Network", networkSchema);