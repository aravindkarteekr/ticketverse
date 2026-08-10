import type { NewTheatre, TheatreEntity, TheatreUpdate } from "../Theatre.js";

export interface TheatreRepository {
  create(theatre: NewTheatre): Promise<TheatreEntity>;
  findById(id: string): Promise<TheatreEntity | null>;
  findByOwnerId(ownerId: string): Promise<TheatreEntity[]>;
  update(id: string, update: TheatreUpdate): Promise<TheatreEntity | null>;
  list(params: {
    page: number;
    limit: number;
  }): Promise<{ items: TheatreEntity[]; total: number }>;
}
