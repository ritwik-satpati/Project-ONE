import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";
import {
  getAdmin,
  loginAdmin,
  logoutAdmin,
} from "../controllers/admin.controller.js";

const router = Router();

// *** Admin Login ***
router.route("/login").post(upload.none(), loginAdmin);

// ### Secured Routes ###

// *** Get Admin Information ***
router.route("/").get(adminAuth, getAdmin);

// *** Admin Logout ***
router.route("/logout").post(adminAuth, logoutAdmin);

export default router;
