import type { NewScreen, ScreenEntity } from "../Screen.js";

export interface ScreenRepository {
  create(screen: NewScreen): Promise<ScreenEntity>;
  findById(id: string): Promise<ScreenEntity | null>;
  findByTheatreId(theatreId: string): Promise<ScreenEntity[]>;
  delete(id: string): Promise<void>;
}
