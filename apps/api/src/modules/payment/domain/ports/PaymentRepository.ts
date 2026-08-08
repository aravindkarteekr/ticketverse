import type { PaymentStatus } from "@ticketverse/schemas";
import type { NewPayment, PaymentEntity } from "../Payment.js";

export interface PaymentRepository {
  create(payment: NewPayment): Promise<PaymentEntity>;
  findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<PaymentEntity | null>;
  updateStatus(id: string, status: PaymentStatus): Promise<PaymentEntity | null>;
}
