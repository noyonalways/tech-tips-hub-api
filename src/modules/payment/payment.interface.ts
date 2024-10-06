import { Document, Types } from "mongoose";

export type TPaymentMethod = "Aamarpay" | "Stripe";
export type TPaymentCurrency = "USD" | "BDT";
export type TPaymentStatus = "Pending" | "Paid" | "Failed" | "Canceled";
export type TSubscriptionType = "Monthly" | "Annual";

export interface IPayment extends Document {
  transactionId: string;
  user: Types.ObjectId;
  paymentMethod: TPaymentMethod;
  amount: number;
  currency: TPaymentCurrency;
  status: TPaymentStatus;
  subscriptionType: TSubscriptionType;
  paymentDate: Date;
  expirationDate: Date;
}
