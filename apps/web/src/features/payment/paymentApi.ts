import type { CreatePaymentIntentResponse } from "@ticketverse/schemas";
import { apiClient } from "../../lib/axiosClient.js";

export async function createPaymentIntent(
  bookingId: string,
): Promise<CreatePaymentIntentResponse> {
  const { data } = await apiClient.post<CreatePaymentIntentResponse>(
    "/payments/intent",
    { bookingId },
  );
  return data;
}
