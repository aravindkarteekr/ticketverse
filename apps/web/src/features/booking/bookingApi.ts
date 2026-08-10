import type { Booking, HoldSeatsResponse, SeatAvailability } from "@ticketverse/schemas";
import { apiClient } from "../../lib/axiosClient.js";

export async function getSeatAvailability(showId: string): Promise<SeatAvailability[]> {
  const { data } = await apiClient.get<SeatAvailability[]>(`/shows/${showId}/seats`);
  return data;
}

export async function holdSeats(showId: string, seatIds: string[]): Promise<HoldSeatsResponse> {
  // The API responds 409 (not 2xx) when some seats are already taken — treat that as a normal response.
  const { data } = await apiClient.post<HoldSeatsResponse>(
    "/bookings/hold",
    { showId, seatIds },
    { validateStatus: (status) => status === 201 || status === 409 },
  );
  return data;
}

export async function createBooking(showId: string, holdId: string, seatIds: string[]): Promise<Booking> {
  const { data } = await apiClient.post<Booking>("/bookings", { showId, holdId, seatIds });
  return data;
}

export async function getBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.get<Booking>(`/bookings/${id}`);
  return data;
}

export interface PaginatedBookings {
  items: Booking[];
  total: number;
}

export async function listMyBookings(params: { page: number; limit: number }): Promise<PaginatedBookings> {
  const { data } = await apiClient.get<PaginatedBookings>("/bookings/mine", { params });
  return data;
}
