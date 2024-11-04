import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import httpStatus from "http-status";
import { QueryBuilder } from "../../builder";
import { AppError } from "../../errors";
import {
  generatePaymentCanceledEmail,
  generatePaymentFailedEmail,
  generatePaymentSuccessEmail,
  sendEmail,
} from "../../utils";
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
          new: true,
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
          new: true,
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

      // send a email to the  user
      await sendEmail({
        to: {
          name: updatedUser.fullName,
          address: updatedUser.email,
        },
        subject: "Payment Successful",
        text: "Payment Successful",
        html: generatePaymentSuccessEmail({
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          amount: updatedPayment.amount,
          currency: updatedPayment.currency,
          status: updatedPayment.status,
          paymentMethod: updatedPayment.paymentMethod,
          subscriptionType: updatedSubscription.type,
          startDate: updatedSubscription.startDate.toLocaleDateString(),
          endDate: updatedSubscription.endDate.toLocaleDateString(),
          paidAt: format(
            toZonedTime(new Date(updatedPayment?.paidAt), "Asia/Dhaka"),
            "M/d/yyyy, h:mm:ss a",
          ),
          transactionId: updatedPayment.transactionId,
        }),
      });

      // eslint-disable-next-line no-console
      console.log(`Email sent to ${updatedUser.email}`);

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
        new: true,
        runValidators: true,
      },
    );

    if (!updatedPayment) {
      throw new AppError(httpStatus.BAD_REQUEST, "Filed to update payment");
    }

    // update the subscription model
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { transactionId: transactionId },
      {
        status: SUBSCRIPTION_STATUS.PENDING,
      },
      {
        session,
        new: true,
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
      { isPremiumUser: false },
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

    await sendEmail({
      to: {
        name: updatedUser.fullName,
        address: updatedUser.email,
      },
      subject: "Payment Failed",
      text: "Payment Failed",
      html: generatePaymentFailedEmail({
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: updatedPayment.status,
        paymentMethod: updatedPayment.paymentMethod,
        transactionId: updatedPayment.transactionId,
        subscriptionType: updatedSubscription.type,
      }),
    });

    // eslint-disable-next-line no-console
    console.log(`Email sent to ${updatedUser.email}`);
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
        new: true,
        runValidators: true,
      },
    );

    if (!updatedPayment) {
      throw new AppError(httpStatus.BAD_REQUEST, "Filed to update payment");
    }

    // update the subscription model
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { transactionId: transactionId },
      {
        status: SUBSCRIPTION_STATUS.CANCELED,
      },
      {
        session,
        new: true,
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
      { isPremiumUser: false },
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

    await sendEmail({
      to: {
        name: updatedUser.fullName,
        address: updatedUser.email,
      },
      subject: "Payment Canceled",
      text: "Payment Canceled",
      html: generatePaymentCanceledEmail({
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: updatedPayment.status,
        paymentMethod: updatedPayment.paymentMethod,
        transactionId: updatedPayment.transactionId,
        subscriptionType: updatedSubscription.type,
      }),
    });

    // eslint-disable-next-line no-console
    console.log(`Email sent to ${updatedUser.email}`);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

// get payment information by transaction id
const getPaymentInfo = async (transactionId: string) => {
  const payment = await Payment.findOne({ transactionId })
    .populate("user")
    .populate("subscription");

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }
  return payment;
};

// get all payments (admin only)
const getAllPayments = async (query: Record<string, unknown>) => {
  const paymentQuery = new QueryBuilder(
    Payment.find({}).populate("user").populate("subscription"),
    query,
  );

  // Await the filter() method
  await paymentQuery.filter();

  // Now you can safely call sort, paginate, and fields
  paymentQuery.sort().paginate().fields();

  const result = await paymentQuery.modelQuery;
  const meta = await paymentQuery.countTotal();

  return { result, meta };
};

export const paymentService = {
  paymentConfirmation,
  paymentFailed,
  paymentCancelled,
  getPaymentInfo,
  getAllPayments,
};
