import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Account } from "../models/account.model.js";
import { SuperAdmin } from "../models/superAdmin.model.js";

const cookieOptions = {
  httpOnly: true,
  // secure: true,
};

// *** Super Admin Registration ***
export const registerSuperAdmin = asyncHandler(async (req, res) => {
  // Extract email and password from the request body
  const { email, password, superPassword } = req.body;

  // Validate that both email and password are provided
  if (
    [email, password, superPassword].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required!!!");
  }

  // Check for existing account with the given email or alternative mail
  const existedAccount = await Account.findOne({
    $or: [{ email: email }, { mailAlternative: email }],
  }).select("+password"); // Include the password field for comparison

  // If no account exists, throw an error
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

  // Check for existing user with the same account ID
  const existedSuperAdmin = await SuperAdmin.findOne({
    accountId: existedAccount._id,
  });

  // If a user already exists, throw an error
  if (existedSuperAdmin) {
    throw new ApiError(409, "Super Admin with email is exist, login now!");
  }

  // Start a new session for transaction handling (Mongoose session)
  const session = await mongoose.startSession();

  try {
    // Start a transaction
    session.startTransaction();

    // Create a new Super Admin record within the session
    const superAdmin = await SuperAdmin.create(
      [
        {
          accountId: existedAccount._id,
          superPassword: superPassword,
        },
      ],
      {
        session: session,
      }
    );

    // Update the existing account with a new user role within the session
    const updatedAccount = await Account.findOneAndUpdate(
      { _id: existedAccount._id },
      {
        $push: {
          role: {
            name: "SUPERADMIN",
            id: superAdmin[0]._id,
            isActive: true,
          },
        },
      },
      { new: true, session: session }
    );

    // Commit the transaction if everything succeeds
    await session.commitTransaction();

    // Close the session
    session.endSession();

    // Remove the supper password field from the super admin before sending response
    superAdmin[0].superPassword = undefined;

    // Respond with status 201 (created) and JSON data including updated account and created user
    return res.status(201).json(
      new ApiResponse(
        201,
        {
          account: updatedAccount,
          superAdmin: superAdmin[0],
        },
        "SUPER ADMIN created successfully"
      )
    );
  } catch (error) {
    // If an error occurs during the transaction, abort the transaction and close the session
    await session.abortTransaction();

    throw new ApiError(409, "Something went wrong during Transaction!");
  }
});

// *** Super Admin Login ***
export const loginSuperAdmin = asyncHandler(async (req, res) => {
  // Extract email and password from the request body
  const { email, password, superPassword } = req.body;

  // Validate that both email and password are provided
  if (
    [email, password, superPassword].some(
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

  // Find the account role with name "SUPERADMIN" from the account roles
  let superAdminAccount;
  existedAccount.role.forEach((role) => {
    if (role.name === "SUPERADMIN") {
      superAdminAccount = role;
    }
  });

  // Throw error if account doesn't have a "SUPERADMIN" role
  if (!superAdminAccount) {
    throw new ApiError(425, "Not a valid Super Admin!");
  }

  // Throw error if the super admin role is not active
  if (!superAdminAccount.isActive) {
    throw new ApiError(423, "Super Admin is not active!");
  }

  // Find the super admin document based on the super admin Id from the "SUPERADMIN" role
  const existedSuperAdmin = await SuperAdmin.findById(
    superAdminAccount?.id
  ).select("+superPassword");
  if (!existedSuperAdmin) {
    throw new ApiError(409, "Something went wrong while searching the admin!");
  }

  // Verify password matches the account's password (implementation from Account model method)
  const isSuperPasswordValid =
    await existedSuperAdmin.isSuperPasswordCorrect(superPassword);
  if (!isSuperPasswordValid) {
    throw new ApiError(401, "Invalid super admin credentials");
  }

  // Generate an access token for the account (implementation from Account model method)
  const accountAccessToken = await existedAccount.generateAccessToken();

  // Generate an access token for the super admin (implementation from Account model method)
  const superAdminAccessToken = await existedSuperAdmin.generateAccessToken();

  // Remove the password field from the account object before sending response
  existedAccount.password = undefined;
  existedSuperAdmin.superPassword = undefined;

  // Set the access token as a cookie and send a success response with account and admin information
  return res
    .status(200)
    .cookie("accountAccessToken", accountAccessToken, cookieOptions)
    .cookie("superAdminAccessToken", superAdminAccessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          account: existedAccount,
          superAdmin: existedSuperAdmin,
        },
        "SUPER ADMIN login successfully"
      )
    );
});

// *** Super Admin Information ***
export const getSuperAdmin = asyncHandler(async (req, res) => {
  // Retrieve user and account data from the request object
  const { account, superAdmin } = req;

  // Return a successful response with user and account information
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { account, superAdmin },
        "SUPER ADMIN fetched successfully"
      )
    );
});

// *** Super Admin Logout ***
export const logoutSuperAdmin = asyncHandler(async (req, res) => {
  // Clear the account access token cookie
  res.clearCookie("accountAccessToken", cookieOptions);
  // Clear the super admin access token cookie
  res.clearCookie("superAdminAccessToken", cookieOptions);

  // Return a successful response indicating logout
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "SUPER ADMIN logged out successfully"));
});
