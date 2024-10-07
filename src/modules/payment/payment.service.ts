import httpStatus from "http-status";
import { AppError } from "../../errors";
import { SUBSCRIPTION_STATUS } from "../subscription/subscription.constant";
import Subscription from "../subscription/subscription.model";
import User from "../user/user.model";
import { PAYMENT_STATUS } from "./payment.constant";
import Payment from "./payment.model";
import { verifyPayment } from "./payment.utils";

const paymentConfirmation = async (transactionId: string) => {
  const existingPayment = await Payment.findOne({ transactionId });
  if (!existingPayment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  // check already paid or not
  if (existingPayment.status === "Paid") {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment already paid");
  }

  // verify the transaction to the payment gateway
  const verifyResponse = await verifyPayment(transactionId);

  if (verifyResponse?.pay_status === "Successful") {
    const session = await Payment.startSession();

    try {
      session.startTransaction();

      // update the payment model status
      const updatedPayment = await Payment.findOneAndUpdate(
        { transactionId: transactionId },
        { status: PAYMENT_STATUS.PAID, paidAt: new Date() },
        {
          session,
          runValidators: true,
        },
      );

      if (!updatedPayment) {
        throw new AppError(httpStatus.BAD_REQUEST, "Filed to complete payment");
      }

      // update the subscription model status
      const updatedSubscription = await Subscription.findOneAndUpdate(
        { transactionId: transactionId },
        {
          status: SUBSCRIPTION_STATUS.ACTIVE,
          startDate: new Date(), // Current date and time
          endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from today
        },
        {
          session,
          runValidators: true,
        },
      );

      if (!updatedSubscription) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Filed to update subscription",
        );
      }

      // update the user model isPremiumUser to true
      const updatedUser = await User.findByIdAndUpdate(
        updatedPayment.user,
        { isPremiumUser: true },
        {
          session,
          new: true,
          runValidators: true,
        },
      );

      if (!updatedUser) {
        throw new AppError(httpStatus.BAD_REQUEST, "Failed to update user");
      }

      await session.commitTransaction();
      session.endSession();

      return true;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } else {
    return false;
  }
};

const paymentFailed = async (transactionId: string) => {
  const existingPayment = await Payment.findOne({ transactionId });
  if (!existingPayment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  const session = await Payment.startSession();

  try {
    session.startTransaction();

    // update the payment model status
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: transactionId },
      { status: PAYMENT_STATUS.FAILED },
      {
        session,
        runValidators: true,
      },
    );

    if (!updatedPayment) {
      throw new AppError(httpStatus.BAD_REQUEST, "Filed to update payment");
    }

    // update the subscription model
    const updatedBooking = await Subscription.findOneAndUpdate(
      { transactionId: transactionId },
      {
        status: SUBSCRIPTION_STATUS.PENDING,
      },
      {
        session,
        runValidators: true,
      },
    );

    if (!updatedBooking) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Filed to update subscription",
      );
    }

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const paymentCancelled = async (transactionId: string) => {
  const existingPayment = await Payment.findOne({ transactionId });
  if (!existingPayment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  const session = await Payment.startSession();

  try {
    session.startTransaction();

    // update the payment model status
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: transactionId },
      { status: PAYMENT_STATUS.CANCELED },
      {
        session,
        runValidators: true,
      },
    );

    if (!updatedPayment) {
      throw new AppError(httpStatus.BAD_REQUEST, "Filed to update payment");
    }

    // update the subscription model
    const updatedBooking = await Subscription.findOneAndUpdate(
      { transactionId: transactionId },
      {
        status: SUBSCRIPTION_STATUS.PENDING,
      },
      {
        session,
        runValidators: true,
      },
    );

    if (!updatedBooking) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Filed to update subscription",
      );
    }

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const paymentService = {
  paymentConfirmation,
  paymentFailed,
  paymentCancelled,
};