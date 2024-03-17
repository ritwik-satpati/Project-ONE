// Import necessary libraries
import mongoose, { Schema } from "mongoose";

// Define the User schema
const userSchema = new Schema(
  {
    // Reference to the Account model
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    // User's public name (trimmed and indexed for efficient search)
    publicName: {
      type: String,
      trim: true,
      index: true,
    },
    // Optional unique username
    userName: {
      type: String,
      unique: true,
      trim: true,
      index: true,
      require: false,
    },
  },
  {
    // Automatically add timestamps to documents
    timestamps: true,
  }
);

// Export the User model
export const User = mongoose.model("User", userSchema);
