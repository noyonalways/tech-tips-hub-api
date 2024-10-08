import httpStatus from "http-status";
import { catchAsync, sendResponse } from "../../utils";
import { userService } from "./user.service";

const updateProfile = catchAsync(async (req, res) => {
  const result = await userService.updateProfile(req.user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User profile updated successfully",
    data: result,
  });
});

// update user profile social links
const updateSocialLinks = catchAsync(async (req, res) => {
  const result = await userService.updateSocialLinks(req.user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User social links updated successfully",
    data: result,
  });
});

// block user (only admin)
const blockUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await userService.blockUser(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User blocked successfully",
    data: result,
  });
});

const unBlockUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await userService.unBlockUser(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User unblock successfully",
    data: result,
  });
});

// follow user
const followUser = catchAsync(async (req, res) => {
  const { id } = req.params; // user id want's to follow
  const result = await userService.followUser(req.user, id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully followed the user",
    data: result,
  });
});

// unfollow user
const unfollowUser = catchAsync(async (req, res) => {
  const { id } = req.params; // user id want's to follow
  const result = await userService.unfollowUser(req.user, id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully unfollowed the user",
    data: result,
  });
});

export const userController = {
  updateProfile,
  updateSocialLinks,
  blockUser,
  unBlockUser,
  followUser,
  unfollowUser,
};
