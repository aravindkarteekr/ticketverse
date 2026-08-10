import { NotFoundError } from "../../../shared/errors/AppError.js";
import type {
  CreateMovieInput,
  UpdateMovieInput,
  MovieSearchQuery,
  PaginationQuery,
} from "@ticketverse/schemas";
import type { MovieRepository } from "../domain/ports/MovieRepository.js";

export function makeCreateMovie(movieRepo: MovieRepository) {
  return (input: CreateMovieInput) => movieRepo.create(input);
}

export function makeUpdateMovie(movieRepo: MovieRepository) {
  return async (id: string, input: UpdateMovieInput) => {
    const updated = await movieRepo.update(id, input);
    if (!updated) throw new NotFoundError("Movie not found");
    return updated;
  };
}

export function makeDeleteMovie(movieRepo: MovieRepository) {
  return (id: string) => movieRepo.delete(id);
}

export function makeGetMovie(movieRepo: MovieRepository) {
  return async (id: string) => {
    const movie = await movieRepo.findById(id);
    if (!movie) throw new NotFoundError("Movie not found");
    return movie;
  };
}

export function makeSearchMovies(movieRepo: MovieRepository) {
  return (query: MovieSearchQuery & PaginationQuery) =>
    movieRepo.search({
      q: query.q,
      genre: query.genre,
      language: query.language,
      page: query.page,
      limit: query.limit,
    });
}
