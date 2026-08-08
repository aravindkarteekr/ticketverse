import type { Movie } from "@ticketverse/schemas";
import { apiClient } from "../../lib/axiosClient.js";

export interface PaginatedMovies {
  items: Movie[];
  total: number;
}

export async function searchMovies(params: { q?: string }): Promise<PaginatedMovies> {
  const { data } = await apiClient.get<PaginatedMovies>("/movies", { params });
  return data;
}

export async function getMovie(id: string): Promise<Movie> {
  const { data } = await apiClient.get<Movie>(`/movies/${id}`);
  return data;
}
