import httpStatus from "http-status";
import { catchAsync, sendResponse } from "../../utils";
import { postService } from "./post.service";

const create = catchAsync(async (req, res) => {
  const result = await postService.create(req.user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Post created successfully",
    data: result,
  });
});

export const postController = {
  create,
};
