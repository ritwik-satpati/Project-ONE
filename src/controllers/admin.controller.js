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
  const { email, password, adminPassword } = req.body;

  // Validate that both email and password are provided
  if (
    [email, password, adminPassword].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
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
    throw new ApiError(425, "Not a valid Admin!");
  }

  // Throw error if the admin role is not active
  if (!adminAccount.isActive) {
    throw new ApiError(423, "Admin role is not active!");
  }

  // Find the admin document based on the admin Id from the "ADMIN" role
  const existedAdmin = await Admin.findById(adminAccount?.id).select(
    "+adminPassword"
  ); // Include the password field for comparison;
  if (!existedAdmin) {
    throw new ApiError(409, "Something went wrong while searching the admin!");
  }

  // Verify password matches the admin's password (implementation from Admin model method)
  const isAdminPasswordValid =
    await existedAdmin.isAdminPasswordCorrect(adminPassword);
  if (!isAdminPasswordValid) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  // Throw error if the admin is not active
  if (!existedAdmin.isActive) {
    throw new ApiError(423, "Admin is not active!");
  }

  // Generate an access token for the account (implementation from Admin model method)
  const adminAccessToken = await existedAdmin.generateAccessToken();

  // Remove the password field from the account object before sending response
  existedAccount.password = undefined;
  existedAdmin.adminPassword = undefined;

  // Set the access token as a cookie and send a success response with account and admin information
  return res
    .status(200)
    .cookie("adminAccessToken", adminAccessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          account: existedAccount,
          admin: existedAdmin,
        },
        "ADMIN login successfully"
      )
    );
});

// *** Get Admin Information ***
export const getAdmin = asyncHandler(async (req, res) => {
  // Retrieve user and account data from the request object
  const { account, admin } = req;

  // Remove the password field from the account object before sending response
  account.password = undefined;
  admin.adminPassword = undefined;

  // Return a successful response with account and admin information
  return res
    .status(200)
    .json(
      new ApiResponse(200, { account, admin }, "ADMIN fetched successfully")
    );
});

// *** Admin Logout ***
export const logoutAdmin = asyncHandler(async (req, res) => {
  // Clear the account access token cookie
  // res.clearCookie("accountAccessToken", cookieOptions);
  // Clear the admin access token cookie
  res.clearCookie("adminAccessToken", cookieOptions);

  // Return a successful response indicating logout
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "ADMIN logged out successfully"));
});
