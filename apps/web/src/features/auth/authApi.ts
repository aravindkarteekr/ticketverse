import type { AuthUser, LoginInput, SignupInput } from "@ticketverse/schemas";
import { apiClient } from "../../lib/axiosClient.js";

export async function loginRequest(input: LoginInput): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>("/auth/login", input);
  return data;
}

export async function signupRequest(input: SignupInput): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>("/auth/signup", input);
  return data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post("/auth/logout");
}
