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

router.route("/register").post(upload.none(), registerUser);
router.route("/login").post(upload.none(), loginUser);
//secured routes
router.route("/").get(userAuth, getUser);
router.route("/logout").post(userAuth, logoutUser);

export default router;
