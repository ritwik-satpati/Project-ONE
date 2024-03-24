// Import necessary libraries
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the Account schema
const accountSchema = new Schema(
  {
    // Indicates the type of account (personal or brand)
    type: {
      type: String,
      enum: ["personal", "brand"],
      default: "personal",
    },
    // Name of the account holder
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Email address of the account holder (unique).
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Alternative email address (unique)
    mailAlternative: {
      type: String,
      // unique: true,
      trim: true,
      required: false,
    },
    // Primary mobile number (unique)
    mobileNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    // Alternative mobile number (unique)
    mobileNumberAlternative: {
      type: String,
      // unique: true,
      trim: true,
      required: false,
    },
    // WhatsApp number (unique)
    whatsappNumber: {
      type: String,
      // unique: true,
      trim: true,
      required: false,
    },
    // Cloydinary URL of the profile picture
    avatar: {
      type: String,
    },
    // Gender of the account holder (optional) for "personal" type account
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    // Hashed password for authentication
    password: {
      type: String,
      required: [true, "Password is required!"],
      select: false,
    },
    // Array of objects representing roles assigned to the account
    role: {
      type: [
        {
          // Name of the role
          name: {
            type: String,
            enum: ["USER", "SELLER", "ADMIN", "SUPERADMIN"],
          },
          // Unique user identifier in the specific schemas depen on role
          id: {
            type: mongoose.Schema.Types.ObjectId,
          },
          // Refresh token for JWT authentication used for Session based login
          roleToken: {
            type: String,
          },
          // Indicates if the role is currently active or not
          isActive: {
            type: Boolean,
          },
        },
      ],
      _id: false,
      // select: false,
      // required: false,
    },
    // Refresh token for JWT authentication used for Session based login
    refreshToken: {
      type: String,
      select: false,
    },
  },
  // Automatic timestamps for creation and updates
  {
    timestamps: true,
  }
);

// Pre-save middleware to hash the password before saving it to the database.
accountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to check if the provided password is correct
accountSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate an access token for authentication
accountSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCOUNT_ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCOUNT_ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Method to generate a refresh token for JWT authentication
accountSchema.method.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCOUNT_REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCOUNT_REFRESH_TOKEN_EXPIRY,
    }
  );
};

// Export the Account model
export const Account = mongoose.model("Account", accountSchema);
