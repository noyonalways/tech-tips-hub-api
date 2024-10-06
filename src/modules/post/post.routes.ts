import { NextFunction, Request, Response, Router } from "express";
import { multerUpload } from "../../config/multer.config";
import { USER_ROLE } from "../../constant";
import { auth, validateRequest } from "../../middlewares";
import { postController } from "./post.controller";
import { postValidationSchema } from "./post.validation";

const postRouter: Router = Router();

postRouter.post(
  "/",
  auth(USER_ROLE.USER),
  multerUpload.single("image"),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.file?.path) {
      req.body.data = JSON.stringify({
        ...JSON.parse(req.body.data),
        coverImage: req.file.path,
      });
    }
    req.body = { ...JSON.parse(req.body.data) };

    next();
  },
  validateRequest(postValidationSchema.create),
  postController.create,
);

// anyone can see all post on the feed
postRouter.get("/", postController.getAll);

// get single post by post id
postRouter.get(
  "/:id",
  // access only free blog post
  postController.getFreeSinglePost,
  auth(USER_ROLE.USER),
  // access premium blog post
  postController.getPremiumSinglePost,
);

// get all current logged in user posts
postRouter.get(
  "/my-posts",
  auth(USER_ROLE.USER),
  postController.getLoggedInUserPosts,
);

export default postRouter;
