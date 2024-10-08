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

// follow a user (id: indicates that the user wanted to follow)
userRouter.put("/:id/follow", auth(USER_ROLE.USER), userController.followUser);

// unfollow a user (id: indicates that the user wanted to unfollow)
userRouter.delete(
  "/:id/unfollow",
  auth(USER_ROLE.USER),
  userController.unfollowUser,
);

// get current logged is user followers
userRouter.get(
  "/my-followers",
  auth(USER_ROLE.USER),
  userController.getLoggedInUserFollowers,
);

// get current logged is user following
userRouter.get(
  "/my-following",
  auth(USER_ROLE.USER),
  userController.getLoggedInUserFollowing,
);

// get all followers by user id
userRouter.get("/:id/followers", userController.getFollowersByUserId);

// get all following by user id
userRouter.get("/:id/following", userController.getFollowingByUserId);

export default userRouter;
