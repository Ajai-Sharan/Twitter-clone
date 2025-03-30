import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { loginController, logoutController, signupController, getMe } from "../controllers/auth.controller.js";

const router = express.Router()

router.get("/me", protectRoute, getMe);
router.post("/signup", signupController)
router.post("/login", loginController)
router.post("/logout", logoutController)

export default router;