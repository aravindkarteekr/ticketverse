import { Schema, model, type InferSchemaType } from "mongoose";

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    genres: { type: [String], required: true, default: [] },
    language: { type: String, required: true, trim: true },
    releaseDate: { type: Date, required: true },
    posterUrl: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

movieSchema.index({ title: "text", description: "text" });

export type MovieDocument = InferSchemaType<typeof movieSchema>;
export const MovieModel = model("Movie", movieSchema);
