import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";

export const createPaymentIntentSchema = z.object({
  bookingId: objectIdSchema,
});
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

export const createPaymentIntentResponseSchema = z.object({
  clientSecret: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
});
export type CreatePaymentIntentResponse = z.infer<typeof createPaymentIntentResponseSchema>;

export const paymentStatusSchema = z.enum(["pending", "succeeded", "failed"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentSchema = z.object({
  id: objectIdSchema,
  bookingId: objectIdSchema,
  stripePaymentIntentId: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  status: paymentStatusSchema,
  createdAt: z.coerce.date(),
});
export type Payment = z.infer<typeof paymentSchema>;
