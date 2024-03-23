// Import necessary libraries
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the Super Admin schema
const superAdminSchema = new Schema(
  {
    // Reference to the Account model
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    // Hashed password for authentication for Super Admin
    superPassword: {
      type: String,
      required: [true, "Super Password is required!"],
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
superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("superPassword")) return next();
  this.superPassword = await bcrypt.hash(this.superPassword, 10);
  next();
});

// Method to check if the provided password is correct
superAdminSchema.methods.isSuperPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.superPassword);
};

// Method to generate an access token for authentication
superAdminSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.SUPERADMIN_ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.SUPERADMIN_ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Export the Super Admin model
export const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);
