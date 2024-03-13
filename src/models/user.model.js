import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    publicName: {
      type: String,
      trim: true,
      index: true,
    },
    userName: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
