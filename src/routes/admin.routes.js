import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { loginAdmin } from "../controllers/admin.controller.js";

const router = Router();

// *** Admin Login ***
router.route("/login").post(upload.none(), loginAdmin);

// ### Secured Routes ###


export default router;
