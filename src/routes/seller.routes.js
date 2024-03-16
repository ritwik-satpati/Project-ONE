import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerSeller, loginSeller } from "../controllers/seller.controller.js";

const router = Router();

router.route("/register").post(upload.none(), registerSeller);
router.route("/login").post(upload.none(), loginSeller);

export default router;
