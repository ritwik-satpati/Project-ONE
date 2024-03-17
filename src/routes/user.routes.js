import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerUser,
  loginUser,
  getUser,
  logoutUser,
} from "../controllers/user.controller.js";
import { userAuth } from "../middlewares/userAuth.middleware.js";

const router = Router();

// *** User Registration ***
router.route("/register").post(upload.none(), registerUser);

// *** User Login ***
router.route("/login").post(upload.none(), loginUser);

// Secured Routes ...

// *** Get User Information ***
router.route("/").get(userAuth, getUser);

// *** User Logout ***
router.route("/logout").post(userAuth, logoutUser);

export default router;
