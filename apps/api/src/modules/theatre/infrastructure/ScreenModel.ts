import { Schema, model, type InferSchemaType } from "mongoose";

const seatLayoutRowSchema = new Schema(
  {
    row: { type: String, required: true },
    seatCount: { type: Number, required: true, min: 1 },
    seatType: { type: String, enum: ["regular", "premium", "recliner"], required: true },
  },
  { _id: false },
);

const screenSchema = new Schema({
  theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", required: true },
  name: { type: String, required: true, trim: true },
  layout: { type: [seatLayoutRowSchema], required: true, default: [] },
});

export type ScreenDocument = InferSchemaType<typeof screenSchema>;
export const ScreenModel = model("Screen", screenSchema);
