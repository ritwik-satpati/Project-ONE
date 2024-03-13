import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const sellerSchema = new Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "XXX",
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "YYY",
    },
  },
  {
    timestamps: true,
  }
);

export const Seller = mongoose.model("Seller", sellerSchema);
