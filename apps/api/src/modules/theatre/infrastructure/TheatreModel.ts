import { Schema, model, type InferSchemaType } from "mongoose";

const theatreSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export type TheatreDocument = InferSchemaType<typeof theatreSchema>;
export const TheatreModel = model("Theatre", theatreSchema);
