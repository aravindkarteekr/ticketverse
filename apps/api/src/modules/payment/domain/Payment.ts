import type { PaymentStatus } from "@ticketverse/schemas";

export interface PaymentEntity {
  id: string;
  bookingId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
}

export type NewPayment = Omit<PaymentEntity, "id" | "createdAt">;
