import { Schema, model, type InferSchemaType } from "mongoose";

const theatreOwnerRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    theatreName: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export type TheatreOwnerRequestDocument = InferSchemaType<
  typeof theatreOwnerRequestSchema
>;
export const TheatreOwnerRequestModel = model(
  "TheatreOwnerRequest",
  theatreOwnerRequestSchema,
);
