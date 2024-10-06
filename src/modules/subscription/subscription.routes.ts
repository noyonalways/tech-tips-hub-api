import { Router } from "express";
import { USER_ROLE } from "../../constant";
import { auth, validateRequest } from "../../middlewares";
import { subscriptionController } from "./subscription.controller";
import { subscriptionValidationSchema } from "./subscription.validation";

const subscriptionRouter: Router = Router();

subscriptionRouter.post(
  "/subscribe",
  auth(USER_ROLE.USER),
  validateRequest(subscriptionValidationSchema.subscribe),
  subscriptionController.subscribe,
);

export default subscriptionRouter;
