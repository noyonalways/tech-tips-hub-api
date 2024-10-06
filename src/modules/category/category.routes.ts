import { Router } from "express";
import { USER_ROLE } from "../../constant";
import { auth, validateRequest } from "../../middlewares";
import { categoryController } from "./category.controller";
import { categoryValidationSchema } from "./category.validation";

const categoryRouter: Router = Router();

categoryRouter
  .route("/")
  .get(categoryController.getAll)
  .post(
    auth(USER_ROLE.ADMIN),
    validateRequest(categoryValidationSchema.create),
    categoryController.create,
  );

categoryRouter
  .route("/:id")
  .get(categoryController.getSingleCategory)
  .delete(categoryController.deleteSingleCategory);

export default categoryRouter;
