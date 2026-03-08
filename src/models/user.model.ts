import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    // balance: { type: Number, default: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);