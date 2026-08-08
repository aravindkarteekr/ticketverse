import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "theatre_owner", "admin"],
      default: "user",
      required: true,
    },
    tokenVersion: { type: Number, default: 0, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
