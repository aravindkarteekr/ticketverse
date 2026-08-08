export interface MovieEntity {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  genres: string[];
  language: string;
  releaseDate: Date;
  posterUrl?: string;
  createdAt: Date;
}

export type NewMovie = Omit<MovieEntity, "id" | "createdAt">;
export type MovieUpdate = Partial<NewMovie>;
