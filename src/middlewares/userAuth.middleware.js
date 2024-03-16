import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Account } from "../models/account.model.js";
import { User } from "../models/user.model.js";

export const userAuth = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accountAccessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const account = await Account.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!account) {
      throw new ApiError(401, "Invalid Access Token");
    }

    let userAccount;

    account.role.forEach((role) => {
      if (role.name === "USER") {
        userAccount = role;
      }
    });
    if (!userAccount) {
      throw new ApiError(425, "User dont exist!");
    }
    if (!userAccount.isActive) {
      throw new ApiError(423, "User role is not active!");
    }

    const user = await User.findById(userAccount?.id);
    if (!user) {
      throw new ApiError(409, "Something went wrong while searching the user!");
    }

    req.account = account;
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
