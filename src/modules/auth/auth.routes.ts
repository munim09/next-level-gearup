import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { authController } from "./auth.controller";

const router = Router();

router.post("/login", authController.loginUser);

router.post("/refresh-token", authController.refreshToken);

router.post("/register", authController.registerUser);

router.get(
    "/me",
    auth(Role.ADMIN, Role.PROVIDER, Role.CUSTOMER),
    authController.getMyProfile,
);

// router.get("/me",
// auth(Role.ADMIN, Role.USER, Role.AUTHOR),
// userController.getMyProfile);

export const authRoutes = router;
