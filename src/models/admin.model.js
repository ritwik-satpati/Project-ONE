// Import necessary libraries
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the Admin schema
const adminSchema = new Schema(
  {
    // Reference to the Account model
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    // Hashed password for authentication for Admin
    adminPassword: {
      type: String,
      required: [true, "Admin Password is required!"],
      select: false,
    },
    // Indicates if currently active or not
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically add timestamps to documents
    timestamps: true,
  }
);

// Pre-save middleware to hash the password before saving it to the database.
adminSchema.pre("save", async function (next) {
  if (!this.isModified("adminPassword")) return next();
  this.adminPassword = await bcrypt.hash(this.adminPassword, 10);
  next();
});

// Method to check if the provided password is correct
adminSchema.methods.isAdminPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.adminPassword);
};

// Method to generate an access token for authentication
adminSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ADMIN_ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ADMIN_ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Export the Super Admin model
export const Admin = mongoose.model("Admin", adminSchema);
