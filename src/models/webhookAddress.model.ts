import mongoose from "mongoose";

const webhookAddressSchema = new mongoose.Schema(
  {
    webhookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Webhook",
      required: true,
      index: true,
    },

    networkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Network",
      required: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for idempotent operations
webhookAddressSchema.index(
  { networkId: 1, address: 1 },
  { unique: true }
);

export default mongoose.model("WebhookAddress", webhookAddressSchema);