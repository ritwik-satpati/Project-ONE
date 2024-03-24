import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Account } from "../models/account.model.js";
import { Admin } from "../models/admin.model.js";

export const adminAuth = asyncHandler(async (req, _, next) => {
  try {
    const adminToken = req.cookies?.adminAccessToken;

    if (!adminToken) {
      throw new ApiError(401, "Unauthorized request!");
    }

    const decodedAdminToken = jwt.verify(
      adminToken,
      process.env.ADMIN_ACCESS_TOKEN_SECRET
    );

    const admin = await Admin.findById(decodedAdminToken?._id).select(
      "+adminPassword"
    );
    if (!admin) {
      throw new ApiError(401, "Invalid Admin Access Token!");
    }
    if (!admin.isActive) {
      throw new ApiError(401, "Admin is not Active!");
    }

    const account = await Account.findById(admin.accountId).select("+password");
    if (!account) {
      throw new ApiError(404, "Account is not found!");
    }

    req.account = account;
    req.admin = admin;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token!");
  }
});
