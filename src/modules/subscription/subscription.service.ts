import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../errors";
import Payment from "../payment/payment.model";
import {
  generateUniqueTransactionId,
  initiatePayment,
} from "../payment/payment.utils";
import User from "../user/user.model";
import { ISubscription } from "./subscription.interface";
import Subscription from "./subscription.model";

const subscribe = async (userData: JwtPayload, payload: ISubscription) => {
  const user = await User.findOne({ email: userData.email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // check the user is already deleted
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User is already deleted");
  }

  // check the is user status
  if (user.status === "Blocked") {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  // check if the user already a premium user
  if (user.isPremiumUser) {
    throw new AppError(httpStatus.FORBIDDEN, "User is already a premium user");
  }

  payload.user = user._id;

  // generate transaction id;
  const transactionId = await generateUniqueTransactionId();
  payload.transactionId = transactionId;

  // initiate payment
  const checkoutDetails = await initiatePayment({
    customerName: user.fullName,
    customerEmail: user.email,
    customerPhone: user?.phone || "N/A",
    address: user.location || "N/A",
    amount: payload.price.toString(),
    currency: payload.currency,
    transactionId: transactionId,
  });

  const paymentData = {
    transactionId,
    user: user._id,
    paymentMethod: payload.paymentMethod,
    currency: payload.currency,
    amount: payload.price,
  };

  const session = await Subscription.startSession();

  try {
    session.startTransaction();

    const subscription = await Subscription.create([{ ...payload }], {
      session,
    });

    if (subscription.length < 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Failed to create subscription",
      );
    }

    const payment = await Payment.create(
      [{ ...paymentData, subscription: subscription[0]._id }],
      { session },
    );

    if (payment.length < 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Failed to create payment");
    }

    await session.commitTransaction();
    session.endSession();

    return checkoutDetails;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const subscriptionService = {
  subscribe,
};
