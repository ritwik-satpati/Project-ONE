import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { accountAuth } from "../middlewares/accountAuth.middleware.js";
import {
  registerAccount,
  loginAccount,
  getAccount,
  logoutAccount,
  updateAvatar,
} from "../controllers/account.controller.js";

const router = Router();

// *** ONE Account Registration ***
router.route("/register").post(upload.none(), registerAccount);

// *** ONE Account Login ***
router.route("/login").post(upload.none(), loginAccount);

// ### Secured Routes ###

// *** ONE Account Information ***
router.route("/").get(accountAuth, getAccount);

// *** ONE Account Logout ***
router.route("/logout").post(accountAuth, logoutAccount);

// *** ONE Account Update Avatar ***
router
  .route("/avatar")
  .post(upload.single("avatar"), accountAuth, updateAvatar);

export default router;
