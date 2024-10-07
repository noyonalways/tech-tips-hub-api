import httpStatus from "http-status";
import { catchAsync, sendResponse } from "../../utils";
import { subscriptionService } from "./subscription.service";

const subscribe = catchAsync(async (req, res) => {
  const result = await subscriptionService.subscribe(req.user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Subscription initiate successfully",
    data: result,
  });
});

export const subscriptionController = {
  subscribe,
};
