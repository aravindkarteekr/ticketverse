import type { CreateShowInput, Show } from "@ticketverse/schemas";
import { apiClient } from "../../lib/axiosClient.js";

export interface PaginatedShows {
  items: Show[];
  total: number;
}

export async function searchShows(params: {
  movieId?: string;
  city?: string;
  date?: string;
}): Promise<PaginatedShows> {
  const { data } = await apiClient.get<PaginatedShows>("/shows", { params });
  return data;
}

export async function listShowsByTheatre(theatreId: string): Promise<Show[]> {
  const { data } = await apiClient.get<Show[]>(`/theatres/${theatreId}/shows`);
  return data;
}

export async function createShow(input: CreateShowInput): Promise<Show> {
  const { data } = await apiClient.post<Show>("/shows", input);
  return data;
}

export async function deleteShow(id: string): Promise<void> {
  await apiClient.delete(`/shows/${id}`);
}
