import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const adminSchema = new Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Admin = mongoose.model("Admin", adminSchema);
