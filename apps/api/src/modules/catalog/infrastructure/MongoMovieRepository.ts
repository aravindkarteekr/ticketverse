import type { HydratedDocument } from "mongoose";
import type { MovieRepository, MovieSearchParams } from "../domain/ports/MovieRepository.js";
import type { MovieEntity, MovieUpdate, NewMovie } from "../domain/Movie.js";
import { MovieModel, type MovieDocument } from "./MovieModel.js";

function toEntity(doc: HydratedDocument<MovieDocument>): MovieEntity {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    durationMinutes: doc.durationMinutes,
    genres: doc.genres,
    language: doc.language,
    releaseDate: doc.releaseDate,
    posterUrl: doc.posterUrl ?? undefined,
    createdAt: doc.createdAt as unknown as Date,
  };
}

export class MongoMovieRepository implements MovieRepository {
  async create(movie: NewMovie): Promise<MovieEntity> {
    const doc = await MovieModel.create(movie);
    return toEntity(doc);
  }

  async findById(id: string): Promise<MovieEntity | null> {
    const doc = await MovieModel.findById(id);
    return doc ? toEntity(doc) : null;
  }

  async update(id: string, update: MovieUpdate): Promise<MovieEntity | null> {
    const doc = await MovieModel.findByIdAndUpdate(id, { $set: update }, { new: true });
    return doc ? toEntity(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await MovieModel.deleteOne({ _id: id });
  }

  async search(params: MovieSearchParams) {
    const filter: Record<string, unknown> = {};
    if (params.q) filter.$text = { $search: params.q };
    if (params.genre) filter.genres = params.genre;
    if (params.language) filter.language = params.language;

    const skip = (params.page - 1) * params.limit;
    const [docs, total] = await Promise.all([
      MovieModel.find(filter).sort({ releaseDate: -1 }).skip(skip).limit(params.limit),
      MovieModel.countDocuments(filter),
    ]);
    return { items: docs.map(toEntity), total };
  }
}
