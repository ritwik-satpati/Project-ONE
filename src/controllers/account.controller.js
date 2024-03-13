import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Account } from "../models/account.model.js";
import { uploadOnCloudinary } from "../utils/cloudinar.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";

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

const registerAccount = asyncHandler(async (req, res) => {
  const { name, mobileNumber, email, password } = req.body;
  if (
    [name, mobileNumber, email, password].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required!!!");
  }

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

  const account = await Account.create({
    name,
    mobileNumber,
    email: email.toLowerCase(),
    password,
  });

  // const createdAccount = await Account.findById(account._id);
  const createdAccount = account;

  if (!createdAccount) {
    throw new ApiError(
      500,
      "Something went wrong while registering the account!"
    );
  }

  return res.status(201).json(
    new ApiResponse(200, createdAccount, "ONE Account created successfully")
    // new ApiResponse(200, {}, "ONE Account created successfully")
  );
});

export { registerAccount };
