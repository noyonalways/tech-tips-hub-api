import {
  TPaymentCurrency,
  TPaymentMethod,
  TPaymentStatus,
  TSubscriptionType,
} from "./payment.interface";

export const PaymentMethods: TPaymentMethod[] = ["Aamarpay", "Stripe"];

export const PaymentCurrencies: TPaymentCurrency[] = ["BDT", "USD"];

export const SubScriptionTypes: TSubscriptionType[] = ["Monthly", "Annual"];

export const PaymentStatus: TPaymentStatus[] = [
  "Pending",
  "Paid",
  "Failed",
  "Canceled",
];
