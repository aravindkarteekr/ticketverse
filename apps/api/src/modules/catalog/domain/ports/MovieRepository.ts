import type { MovieEntity, MovieUpdate, NewMovie } from "../Movie.js";

export interface MovieSearchParams {
  q?: string;
  genre?: string;
  language?: string;
  page: number;
  limit: number;
}

export interface MovieRepository {
  create(movie: NewMovie): Promise<MovieEntity>;
  findById(id: string): Promise<MovieEntity | null>;
  update(id: string, update: MovieUpdate): Promise<MovieEntity | null>;
  delete(id: string): Promise<void>;
  search(params: MovieSearchParams): Promise<{ items: MovieEntity[]; total: number }>;
}
