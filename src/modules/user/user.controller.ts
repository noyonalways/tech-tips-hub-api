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

// update usr profile social links

const updateSocialLinks = catchAsync(async (req, res) => {
  const result = await userService.updateSocialLinks(req.user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User social links updated successfully",
    data: result,
  });
});

export const userController = {
  updateProfile,
  updateSocialLinks,
};
