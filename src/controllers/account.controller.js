import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Account } from "../models/account.model.js";
import fs from "fs";
import { uploadOnCloudinary, destroyOnCloudinary } from "../utils/cloudinar.js";

// * Cookie Options *
const cookieOptions = {
  httpOnly: true,
  // secure: true,
};

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

  // Validate email format (example using regular expressions)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format!");
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

// *** ONE Account Login ***
export const loginAccount = asyncHandler(async (req, res) => {
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
        { account: existedAccount },
        "ONE Account login successfully"
      )
    );
});

// *** ONE Account Information ***
export const getAccount = asyncHandler(async (req, res) => {
  // Retrieve user and account data from the request object
  const { account } = req;

  // Return a successful response with user and account information
  return res
    .status(200)
    .json(
      new ApiResponse(200, { account }, "ONE Account fetched successfully")
    );
});

// *** ONE Account Logout ***
export const logoutAccount = asyncHandler(async (req, res) => {
  // Clear the account access token cookie
  res.clearCookie("accountAccessToken", cookieOptions);

  // Return a successful response indicating logout
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "ONE Account logged out successfully"));
});

// * Avater Unlink - Function *
const unlinkAvatar = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      throw new ApiError(500, "Error deleting avatar!");
    }
  });
};

// *** Avatar Add or Update ***
export const updateAvatar = asyncHandler(async (req, res) => {
  // File upload check
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }

  // Account retrieval using accountAuth middleware
  const account = req.account;

  const folderNameOnCloudinary = "account_avatars";

  const avatarOnCloudinary = await uploadOnCloudinary(
    avatarLocalPath,
    folderNameOnCloudinary
  );

  // Cleanup local file after upload
  await unlinkAvatar(avatarLocalPath);

  if (!avatarOnCloudinary) {
    throw new ApiError(400, "Avatar file upload failed!");
  }

  try {
    // Delete existing avatar on cloudinary if it exists
    if (account?.avatar?.service === "Cloudinary") {
      await destroyOnCloudinary(account?.avatar?.id);
    }

    // Update Account model with new cloudinary avatar id and url
    const updatedAccount = await Account.findOneAndUpdate(
      { _id: account._id },
      {
        avatar: {
          id: avatarOnCloudinary.public_id,
          url: avatarOnCloudinary.url,
          service: "Cloudinary",
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedAccount, "Avatar updated successfully")
      );
  } catch (error) {
    // Delete newly created avatar on Cloudinary if error occures during updating Account model
    await destroyOnCloudinary(avatarOnCloudinary.public_id);

    throw new ApiError(400, "Avatar file update failed!");
  }
});
