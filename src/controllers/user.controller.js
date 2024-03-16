import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Account } from "../models/account.model.js";
import { User } from "../models/user.model.js";

const cookieOptions = {
  httpOnly: true,
  // secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if ([email, password].some((field) => !field || field?.trim() === "")) {
    throw new ApiError(400, "All fields are required!!!");
  }

  const existedAccount = await Account.findOne({
    $or: [{ email: email }, { mailAlternative: email }],
  });
  if (!existedAccount) {
    throw new ApiError(
      409,
      "Account with email is not exist, create an Account first!"
    );
  }

  const existedUser = await User.findOne({ accountId: existedAccount._id });
  if (existedUser) {
    throw new ApiError(409, "User with email is exist, login now!");
  }

  const user = await User.create({
    accountId: existedAccount._id,
  });

  const updatedAccount = await Account.findOneAndUpdate(
    { _id: existedAccount._id },
    {
      $push: {
        role: {
          name: "USER",
          id: user._id,
          isActive: true,
        },
      },
    },
    { new: true }
  );

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
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if ([email, password].some((field) => !field || field?.trim() === "")) {
    throw new ApiError(400, "All fields are required!!!");
  }

  // const existedAccount = await Account.findOne({ email: email });
  const existedAccount = await Account.findOne({
    $or: [{ email: email }, { mailAlternative: email }],
  }).select("+password");
  if (!existedAccount) {
    throw new ApiError(
      409,
      "Account with email is not exist, create an Account first!!"
    );
  }

  const isPasswordValid = await existedAccount.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid account credentials");
  }

  let userAccount;
  existedAccount.role.forEach((role) => {
    if (role.name === "USER") {
      userAccount = role;
    }
  });
  if (!userAccount) {
    throw new ApiError(425, "Need to register as an user!");
  }
  if (!userAccount.isActive) {
    throw new ApiError(423, "User role is not active!");
  }

  const existedUser = await User.findById(userAccount?.id);
  if (!existedUser) {
    throw new ApiError(409, "Something went wrong while searching the user!");
  }

  // const {accessToken} = await generateAccessToken(user._id)
  const accountAccessToken = await existedAccount.generateAccessToken();

  existedAccount.password = undefined;

  return res
    .status(200)
    .cookie("accountAccessToken", accountAccessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          account: existedAccount,
          user: existedUser,
        },
        "User login successfully"
      )
    );
});

const getUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        account: req.account,
        user: req.user,
      },
      "User fetched successfully"
    )
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("accountAccessToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export { loginUser, registerUser, getUser, logoutUser };
