import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Account } from "../models/account.model.js";
import fs from "fs";
import { uploadOnCloudinary } from "../utils/cloudinar.js";

const generateAccessAndRefereshTokensX = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const generateAccessTokens = async (userId) => {
  try {
    const account = await Account.findById(userId);
    const accessToken = account.generateAccessToken();

    return { accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const unlinkAvatar = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      res.status(500).json({ message: "Error deleting avatar!" });
    }
  });
};

const registerAccountX = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }

  const { name, mobileNumber, email, password } = req.body;
  if (
    [name, mobileNumber, email, password].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    unlinkAvatar(avatarLocalPath);
    throw new ApiError(400, "All fields are required!");
  }

  const existedAccount = await Account.findOne({
    $or: [{ email }, { mobileNumber }],
  });
  if (existedAccount) {
    unlinkAvatar(avatarLocalPath);
    throw new ApiError(
      409,
      "Account with mobile number or email already exist!"
    );
  }

  const folderNameOnCloudinary = "account_avatars";
  const avatarOnCloudinary = await uploadOnCloudinary(
    avatarLocalPath,
    folderNameOnCloudinary
  );
  if (!avatarOnCloudinary) {
    throw new ApiError(400, "Avatar file upload failed!");
  }
  unlinkAvatar(avatarLocalPath);

  const account = await Account.create({
    name,
    mobileNumber,
    email: email.toLowerCase(),
    avatar: avatarOnCloudinary.url,
    password,
  });

  const createdAccount = await Account.findById(account._id).select(
    "-password -refreshToken"
  );
  if (!createdAccount) {
    throw new ApiError(
      500,
      "Something went wrong while registering the account!"
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        createdAccount,
        "ONE Account registered successfully"
      )
    );
});

// *** ONE Account Registration ***
export const registerAccount = asyncHandler(async (req, res) => {
  // Extract user information from request body
  const { name, mobileNumber, email, password } = req.body;

  // Validate that all fields are provided
  if (
    [name, mobileNumber, email, password].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required!!!");
  }

  // Check for existing account with various identifiers
  const existedAccount = await Account.findOne({
    $or: [
      { email: email },
      { mailAlternative: email },
      { mobileNumber: mobileNumber },
      { mobileNumberAlternative: mobileNumber },
      { whatsappNumber: mobileNumber },
    ],
  });
  if (existedAccount) {
    throw new ApiError(
      409,
      "Account with mobile number or email already exist!"
    );
  }

  // Create a new account document
  const account = await Account.create({
    name,
    mobileNumber,
    email: email.toLowerCase(), // Convert email to lowercase for case-insensitive matching
    password,
  });

  // Use the created account object directly (assuming no further processing needed)
  const createdAccount = account;

  // Check if account creation was successful
  if (!createdAccount) {
    throw new ApiError(
      500,
      "Something went wrong while registering the account!"
    );
  }

  // Remove the password field from the account object before sending response
  createdAccount.password = undefined;

  // Return a successful response with the created account information
  return res
    .status(201)
    .json(
      new ApiResponse(201, createdAccount, "ONE Account created successfully")
    );
});
