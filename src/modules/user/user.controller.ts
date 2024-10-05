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

export const userController = {
  updateProfile,
};
