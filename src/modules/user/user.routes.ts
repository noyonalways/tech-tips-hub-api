import { NextFunction, Request, Response, Router } from "express";
import { multerUpload } from "../../config/multer.config";
import { USER_ROLE } from "../../constant";
import { auth, validateRequest } from "../../middlewares";
import { userController } from "./user.controller";
import { userValidationSchema } from "./user.validation";

const userRouter: Router = Router();

// update logged in user profile endpoints
userRouter.patch(
  "/update-profile",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  multerUpload.single("image"),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.file?.path) {
      req.body.data = JSON.stringify({
        ...JSON.parse(req.body.data),
        profilePicture: req.file.path,
      });
    }
    req.body = { ...JSON.parse(req.body.data) };

    next();
  },
  validateRequest(userValidationSchema.updateProfile),
  userController.updateProfile,
);

// update user profile social links
userRouter.put(
  "/profile/update-social-links",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  validateRequest(userValidationSchema.updateSocialLinks),
  userController.updateSocialLinks,
);

// block user (admin only)
userRouter.patch("/:id/block", auth(USER_ROLE.ADMIN), userController.blockUser);

// unblock user (admin only)
userRouter.patch(
  "/:id/unblock",
  auth(USER_ROLE.ADMIN),
  userController.unBlockUser,
);

export default userRouter;
