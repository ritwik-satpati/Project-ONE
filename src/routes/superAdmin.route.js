import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { superAdminAuth } from "../middlewares/superAdminAuth.middleware.js";
import {
  registerSuperAdmin,
  loginSuperAdmin,
  getSuperAdmin,
  logoutSuperAdmin,
} from "../controllers/superAdmin.controller.js";

const router = Router();

// *** Super Admin Registration ***
router.route("/register").post(upload.none(), registerSuperAdmin);

// *** Super Admin Login ***
router.route("/login").post(upload.none(), loginSuperAdmin);

// ### Secured Routes ###

// *** Super Admin Information ***
router.route("/").get(superAdminAuth, getSuperAdmin);

// *** Super Admin Logout ***
router.route("/logout").post(superAdminAuth, logoutSuperAdmin);

export default router;
