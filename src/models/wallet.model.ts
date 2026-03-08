import mongoose from "mongoose";
import { Decimal128 } from "mongodb";

const walletSchema = new mongoose.Schema(
    {
        userId:{type:mongoose.Schema.Types.ObjectId, ref:'User',required:true},
        balance:{type:mongoose.Schema.Types.Decimal128,default:Decimal128.fromString("0")},
        address:{type:String,required:true,unique:true},
        addressPrivateKey:{type:String,required:true,unique:true},
    },
    { timestamps: true }
);
export default mongoose.model("Wallet", walletSchema);