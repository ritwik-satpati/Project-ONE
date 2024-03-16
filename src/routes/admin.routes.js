import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { loginAdmin } from "../controllers/admin.controller.js";

const router = Router();

router.route("/login").post(upload.none(), loginAdmin);

export default router;
