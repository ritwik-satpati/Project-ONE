import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Account } from "../models/account.model.js";
import { SuperAdmin } from "../models/superAdmin.model.js";

export const superAdminAuth = asyncHandler(async (req, _, next) => {
  try {
    const superAdminToken = req.cookies?.superAdminAccessToken;

    if (!superAdminToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedSuperAdminToken = jwt.verify(
      superAdminToken,
      process.env.SUPERADMIN_ACCESS_TOKEN_SECRET
    );

    const superAdmin = await SuperAdmin.findById(
      decodedSuperAdminToken?._id
    ).select("-superPassword");
    if (!superAdmin) {
      throw new ApiError(401, "Invalid Super Admin Access Token");
    }

    const account = await Account.findById(superAdmin.accountId).select(
      "-password -refreshToken"
    );
    if (!account) {
      throw new ApiError(401, "Invalid Account Access Token");
    }

    req.account = account;
    req.superAdmin = superAdmin;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
