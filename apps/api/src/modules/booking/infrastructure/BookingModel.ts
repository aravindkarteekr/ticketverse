import { Schema, model, type InferSchemaType } from "mongoose";

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    showId: { type: Schema.Types.ObjectId, ref: "Show", required: true },
    seatIds: { type: [String], required: true },
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "expired", "cancelled"],
      required: true,
      default: "pending_payment",
    },
    totalAmount: { type: Number, required: true, min: 0 },
    holdId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ showId: 1, status: 1 });

export type BookingDocument = InferSchemaType<typeof bookingSchema>;
export const BookingModel = model("Booking", bookingSchema);
