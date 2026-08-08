import { z } from "zod";
import { objectIdSchema } from "./common.schema.js";
import { roleSchema } from "./auth.schema.js";

export const userSchema = z.object({
  id: objectIdSchema,
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
  createdAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const theatreOwnerRequestStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type TheatreOwnerRequestStatus = z.infer<typeof theatreOwnerRequestStatusSchema>;

export const createTheatreOwnerRequestSchema = z.object({
  theatreName: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  reason: z.string().trim().max(1000).optional(),
});
export type CreateTheatreOwnerRequestInput = z.infer<typeof createTheatreOwnerRequestSchema>;

export const reviewTheatreOwnerRequestSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(1000).optional(),
});
export type ReviewTheatreOwnerRequestInput = z.infer<typeof reviewTheatreOwnerRequestSchema>;

export const theatreOwnerRequestSchema = z.object({
  id: objectIdSchema,
  userId: objectIdSchema,
  theatreName: z.string(),
  city: z.string(),
  reason: z.string().optional(),
  status: theatreOwnerRequestStatusSchema,
  createdAt: z.coerce.date(),
});
export type TheatreOwnerRequest = z.infer<typeof theatreOwnerRequestSchema>;
