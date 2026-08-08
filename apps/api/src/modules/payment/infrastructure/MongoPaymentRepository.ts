import type { HydratedDocument } from "mongoose";
import type { PaymentStatus } from "@ticketverse/schemas";
import type { PaymentRepository } from "../domain/ports/PaymentRepository.js";
import type { NewPayment, PaymentEntity } from "../domain/Payment.js";
import { PaymentModel, type PaymentDocument } from "./PaymentModel.js";

function toEntity(doc: HydratedDocument<PaymentDocument>): PaymentEntity {
  return {
    id: doc._id.toString(),
    bookingId: doc.bookingId.toString(),
    stripePaymentIntentId: doc.stripePaymentIntentId,
    amount: doc.amount,
    currency: doc.currency,
    status: doc.status as PaymentStatus,
    createdAt: doc.createdAt as unknown as Date,
  };
}

export class MongoPaymentRepository implements PaymentRepository {
  async create(payment: NewPayment): Promise<PaymentEntity> {
    const doc = await PaymentModel.create(payment);
    return toEntity(doc);
  }

  async findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<PaymentEntity | null> {
    const doc = await PaymentModel.findOne({ stripePaymentIntentId });
    return doc ? toEntity(doc) : null;
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<PaymentEntity | null> {
    const doc = await PaymentModel.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    return doc ? toEntity(doc) : null;
  }
}
