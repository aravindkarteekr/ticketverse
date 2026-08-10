import type { NewShow, ShowEntity, ShowUpdate } from "../Show.js";

export interface ShowSearchParams {
  movieId?: string;
  theatreIds?: string[];
  date?: Date;
  page: number;
  limit: number;
}

export interface ShowRepository {
  create(show: NewShow): Promise<ShowEntity>;
  findById(id: string): Promise<ShowEntity | null>;
  update(id: string, update: ShowUpdate): Promise<ShowEntity | null>;
  delete(id: string): Promise<void>;
  search(
    params: ShowSearchParams,
  ): Promise<{ items: ShowEntity[]; total: number }>;
  findByTheatreId(theatreId: string): Promise<ShowEntity[]>;
}
