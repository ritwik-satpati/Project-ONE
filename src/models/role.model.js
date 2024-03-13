import mongoose, { Schema } from "mongoose";

// Define the schema for the Role collection
const roleSchema = new Schema(
  {
    // Name of the Role
    name: {
      type: String, // "USER", "SELLER", "ADMIN", "SUPERADMIN"
      required: true,
      trim: true,
    },
    // Type of role (normal, special)
    type: {
      type: String, // "normal", "premium", "special"
      enum: ["normal", "premium", "special"],
      default: "normal",
    },
    application: {
      type: String,
      require: true,
    },
    zone: {
      type: String,
      require: true,
    },
  },
  // Automatic timestamps for creation and updates
  {
    timestamps: true,
  }
);

// Create & Export a Mongoose model for the Role collection
export const Role = mongoose.model("Role", roleSchema);
