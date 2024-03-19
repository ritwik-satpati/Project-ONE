import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Account } from "../models/account.model.js";
import { User } from "../models/user.model.js";

const cookieOptions = {
  httpOnly: true,
  // secure: true,
};

// *** User Registration ***
export const registerUser = asyncHandler(async (req, res) => {
  // Extract email and password from the request body
  const { email, password } = req.body;

  // Validate that both email and password are provided
  if ([email, password].some((field) => !field || field?.trim() === "")) {
    throw new ApiError(400, "All fields are required!!!");
  }

  // Check for existing account with the given email or alternative mail
  const existedAccount = await Account.findOne({
    $or: [{ email: email }, { mailAlternative: email }],
  });

  // If no account exists, throw an error
  if (!existedAccount) {
    throw new ApiError(
      409,
      "Account with email is not exist, create an Account first!"
    );
  }

  // Check for existing user with the same account ID
  const existedUser = await User.findOne({ accountId: existedAccount._id });

  // If a user already exists, throw an error
  if (existedUser) {
    throw new ApiError(409, "User with email is exist, login now!");
  }

  // Start a new session for transaction handling (Mongoose session)
  const session = await mongoose.startSession();

  try {
    // Start a transaction
    session.startTransaction();

    // Create a new user record within the session
    const user = await User.create([{ accountId: existedAccount._id }], {
      session: session,
    });

    // Update the existing account with a new user role within the session
    const updatedAccount = await Account.findOneAndUpdate(
      { _id: existedAccount._id },
      {
        $push: {
          role: {
            name: "USER",
            id: user[0]._id,
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

    // Respond with status 201 (created) and JSON data including updated account and created user
    return res.status(201).json(
      new ApiResponse(
        201,
        {
          account: updatedAccount,
          user: user,
        },
        "User created successfully"
      )
    );
  } catch (error) {
    // If an error occurs during the transaction, abort the transaction and close the session
    await session.abortTransaction();

    throw new ApiError(409, "Something went wrong during Transaction!");
  }
});

// *** User Login ***
export const loginUser = asyncHandler(async (req, res) => {
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

  // Find the user role with name "USER" from the account roles
  let userAccount;
  existedAccount.role.forEach((role) => {
    if (role.name === "USER") {
      userAccount = role;
    }
  });

  // Throw error if account doesn't have a "USER" role
  if (!userAccount) {
    throw new ApiError(425, "Need to register as an user!");
  }

  // Throw error if the user role is not active
  if (!userAccount.isActive) {
    throw new ApiError(423, "User role is not active!");
  }

  // Find the user document based on the user ID from the "USER" role
  const existedUser = await User.findById(userAccount?.id);
  if (!existedUser) {
    throw new ApiError(409, "Something went wrong while searching the user!");
  }

  // Generate an access token for the account (implementation from Account model method)
  const accountAccessToken = await existedAccount.generateAccessToken();

  // Remove the password field from the account object before sending response
  existedAccount.password = undefined;

  // Set the access token as a cookie and send a success response with account and user information
  return res
    .status(200)
    .cookie("accountAccessToken", accountAccessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { account: existedAccount, user: existedUser },
        "User login successfully"
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
  return res.status(200).json(new ApiResponse(200, {}, "User logged out"));
});
