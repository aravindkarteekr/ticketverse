import type {
  Booking,
  CreateMovieInput,
  Movie,
  Theatre,
  TheatreOwnerRequest,
  UpdateMovieInput,
  User,
} from "@ticketverse/schemas";
import { apiClient } from "../../lib/axiosClient.js";

export interface Paginated<T> {
  items: T[];
  total: number;
}

export async function listPendingTheatreOwnerRequests(): Promise<
  TheatreOwnerRequest[]
> {
  const { data } = await apiClient.get<TheatreOwnerRequest[]>(
    "/admin/theatre-owner-requests",
    {
      params: { status: "pending" },
    },
  );
  return data;
}

export async function reviewTheatreOwnerRequest(
  id: string,
  input: { decision: "approved" | "rejected"; reason?: string },
): Promise<void> {
  await apiClient.post(`/theatre-owner-requests/${id}/review`, input);
}

export async function listUsers(params: {
  page: number;
  limit: number;
}): Promise<Paginated<User>> {
  const { data } = await apiClient.get<Paginated<User>>("/admin/users", {
    params,
  });
  return data;
}

export async function listAdminTheatres(params: {
  page: number;
  limit: number;
}): Promise<Paginated<Theatre>> {
  const { data } = await apiClient.get<Paginated<Theatre>>("/admin/theatres", {
    params,
  });
  return data;
}

export async function listAdminBookings(params: {
  page: number;
  limit: number;
}): Promise<Paginated<Booking>> {
  const { data } = await apiClient.get<Paginated<Booking>>("/admin/bookings", {
    params,
  });
  return data;
}

export async function createMovie(input: CreateMovieInput): Promise<Movie> {
  const { data } = await apiClient.post<Movie>("/movies", input);
  return data;
}

export async function updateMovie(
  id: string,
  input: UpdateMovieInput,
): Promise<Movie> {
  const { data } = await apiClient.patch<Movie>(`/movies/${id}`, input);
  return data;
}

export async function deleteMovie(id: string): Promise<void> {
  await apiClient.delete(`/movies/${id}`);
}
