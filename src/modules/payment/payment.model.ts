import { model, Schema } from "mongoose";
import {
  PaymentCurrencies,
  PaymentMethods,
  PaymentStatus,
  SubScriptionTypes,
} from "./payment.constant";
import { IPayment } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
  {
    transactionId: {
      type: String,
      required: [true, "Transaction Id is required"],
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User Id is required"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: PaymentMethods,
        message: "{VALUE} is not a valid payment method",
      },
      required: [true, "PaymentMethods is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    currency: {
      type: String,
      enum: {
        values: PaymentCurrencies,
        message: "{VALUE} is not a valid currency",
      },
      required: [true, "Payment currency is required"],
    },
    status: {
      type: String,
      enum: {
        values: PaymentStatus,
        message: "{VALUE} is not a valid payment status",
      },
      default: "Pending",
    },
    subscriptionType: {
      type: String,
      enum: {
        values: SubScriptionTypes,
        message: "{VALUE} is not a valid subscription type",
      },
      default: "Monthly",
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment Date is required"],
    },
    expirationDate: {
      type: Date,
      required: [true, "Payment Expiration Date is required"],
    },
  },
  {
    timestamps: true,
  },
);

const Payment = model<IPayment>("Payment", paymentSchema);

export default Payment;
