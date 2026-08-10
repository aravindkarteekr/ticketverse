import { Schema, model, type InferSchemaType } from "mongoose";

const seatPricingSchema = new Schema(
  {
    seatType: {
      type: String,
      enum: ["regular", "premium", "recliner"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const showSchema = new Schema(
  {
    movieId: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
    screenId: { type: Schema.Types.ObjectId, ref: "Screen", required: true },
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", required: true },
    startTime: { type: Date, required: true },
    pricing: { type: [seatPricingSchema], required: true, default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

showSchema.index({ movieId: 1, startTime: 1 });
showSchema.index({ theatreId: 1, startTime: 1 });

export type ShowDocument = InferSchemaType<typeof showSchema>;
export const ShowModel = model("Show", showSchema);
