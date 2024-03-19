import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Account } from "../models/account.model.js";

export const accountAuth = asyncHandler(async (req, _, next) => {
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

    req.account = account;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
