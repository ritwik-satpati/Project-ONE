import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Account } from "../models/account.model.js";
import { Admin } from "../models/admin.model.js";

const cookieOptions = {
  httpOnly: true,
  // secure: true,
};

// *** Admin Login ***
export const loginAdmin = asyncHandler(async (req, res) => {
  // Extract email and password from the request body
  const { email, password } = req.body;

  // Validate that both email and password are provided
  if ([email, password].some((field) => !field || field?.trim() === "")) {
    throw new ApiError(400, "All fields are required!!!");
  }

  // Find account with matching email or alternative email
  const existedAccount = await Account.findOne({
    $or: [{ email: email }, { mailAlternative: email }],
  }).select("+password"); // Include the password field for comparison

  // Throw error if account is not found
  if (!existedAccount) {
    throw new ApiError(
      409,
      "Account with email is not exist, create an Account first!"
    );
  }

  // Verify password matches the account's password (implementation from Account model method)
  const isPasswordValid = await existedAccount.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid account credentials");
  }

  // Find the account role with name "ADMIN" from the account roles
  let adminAccount;
  existedAccount.role.forEach((role) => {
    if (role.name === "ADMIN") {
      adminAccount = role;
    }
  });

  // Throw error if account doesn't have a "ADMIN" role
  if (!adminAccount) {
    throw new ApiError(425, "Need to register as an admin!");
  }

  // Throw error if the admin role is not active
  if (!adminAccount.isActive) {
    throw new ApiError(423, "Admin role is not active!");
  }

  // Find the admin document based on the admin Id from the "ADMIN" role
  const existedAdmin = await Admin.findById(adminAccount?.id);
  if (!existedAdmin) {
    throw new ApiError(409, "Something went wrong while searching the admin!");
  }

  // Generate an access token for the account (implementation from Account model method)
  const accountAccessToken = await existedAccount.generateAccessToken();

  // Remove the password field from the account object before sending response
  existedAccount.password = undefined;

  // Set the access token as a cookie and send a success response with account and admin information
  return res
    .status(200)
    .cookie("accountAccessToken", accountAccessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          account: existedAccount,
          admin: existedAdmin,
        },
        "Admin login successfully"
      )
    );
});

// *** Get User Information ***
export const getUser = asyncHandler(async (req, res) => {
  // Retrieve user and account data from the request object
  const { account, user } = req;

  // Return a successful response with user and account information
  return res
    .status(200)
    .json(new ApiResponse(200, { account, user }, "User fetched successfully"));
});

// *** User Logout ***
export const logoutUser = asyncHandler(async (req, res) => {
  // Clear the account access token cookie
  res.clearCookie("accountAccessToken", cookieOptions);

  // Return a successful response indicating logout
  return res.status(200).json(new ApiResponse(200, {}, "User logged Out"));
});
