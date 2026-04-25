import mongoose from "mongoose";

const webhookSchema = new mongoose.Schema(
  {
    networkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Network",
      required: true,
      index: true,
    },

    webhookId: {
      type: String,
      required: true,
      unique: true,
    },

    provider: {
      type: String,
      required: true,
      enum: ['ALCHEMY', 'TENDERLY', 'CUSTOM'],
      default: 'ALCHEMY',
    },

    addressCount: {
      type: Number,
      default: 0,
    },

    maxAddresses: {
      type: Number,
      default: 45000,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'FULL', 'DISABLED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding webhooks with available slots
webhookSchema.index(
  { networkId: 1, status: 1, addressCount: 1 },
  { partialFilterExpression: { status: 'ACTIVE', addressCount: { $lt: 45000 } } }
);

export default mongoose.model("Webhook", webhookSchema);