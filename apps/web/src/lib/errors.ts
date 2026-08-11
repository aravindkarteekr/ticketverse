import { isAxiosError } from "axios";

/** Extracts a user-facing message from an API error response, falling back to a generic message. */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isAxiosError(error)) {
    const message = (
      error.response?.data as { error?: { message?: string } } | undefined
    )?.error?.message;
    if (message) return message;
    if (error.message === "Network Error") {
      return "Can't reach the server. Check your connection and try again.";
    }
  }
  return fallback;
}
