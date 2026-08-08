import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectMongo(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  return mongoose.connect(uri);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
