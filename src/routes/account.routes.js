import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerAccount } from "../controllers/account.controller.js";

const router = Router();

// *** ONE Account Registration ***
// router.route("/register").post(upload.single("avatar"), registerAccount);
router.route("/register").post(upload.none(), registerAccount);

export default router;
