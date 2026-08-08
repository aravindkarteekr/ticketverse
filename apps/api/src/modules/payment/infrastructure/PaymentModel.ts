import { Schema, model, type InferSchemaType } from "mongoose";

const paymentSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    stripePaymentIntentId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      required: true,
      default: "pending",
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export type PaymentDocument = InferSchemaType<typeof paymentSchema>;
export const PaymentModel = model("Payment", paymentSchema);
