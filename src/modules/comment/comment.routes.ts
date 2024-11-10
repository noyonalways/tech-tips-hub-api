import { Router } from "express";
import { USER_ROLE } from "../../constant";
import { auth } from "../../middlewares";
import { commentController } from "./comment.controller";

const commentRouter: Router = Router();

commentRouter.delete(
  "/:id",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  commentController.deleteComment,
);

export default commentRouter;
