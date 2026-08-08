import type { Show } from "@ticketverse/schemas";
import { apiClient } from "../../lib/axiosClient.js";

export interface PaginatedShows {
  items: Show[];
  total: number;
}

export async function searchShows(params: { movieId?: string; city?: string; date?: string }): Promise<PaginatedShows> {
  const { data } = await apiClient.get<PaginatedShows>("/shows", { params });
  return data;
}
