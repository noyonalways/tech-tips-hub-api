import { Router } from "express";
import { validateRequest } from "../../middlewares";
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

export default authRoutes;
