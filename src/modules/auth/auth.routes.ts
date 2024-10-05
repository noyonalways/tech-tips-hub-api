import { Router } from "express";
import { USER_ROLE } from "../../constant";
import { auth, validateRequest } from "../../middlewares";
import { authController } from "./auth.controller";
import { authValidationSchema } from "./auth.validation";

const authRoutes: Router = Router();

authRoutes.post(
  "/register",
  validateRequest(authValidationSchema.register),
  authController.register,
);

authRoutes.post(
  "/login",
  validateRequest(authValidationSchema.login),
  authController.login,
);

authRoutes.get(
  "/me",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  authController.getMe,
);

authRoutes.put(
  "/change-password",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  validateRequest(authValidationSchema.changePassword),
  authController.changePassword,
);

authRoutes.post(
  "/forget-password",
  validateRequest(authValidationSchema.forgetPassword),
  authController.forgetPassword,
);

authRoutes.post(
  "/reset-password",
  validateRequest(authValidationSchema.resetPassword),
  authController.resetPassword,
);

export default authRoutes;
