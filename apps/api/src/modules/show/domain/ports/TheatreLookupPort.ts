/**
 * Anti-corruption port so `show` can validate/search across theatres and screens
 * without depending on the `theatre` module's internals directly.
 */
export interface TheatreLookupPort {
  findTheatreIdsByCity(city: string): Promise<string[]>;
  getScreenContext(screenId: string): Promise<{ theatreId: string; ownerId: string } | null>;
  getTheatreOwnerId(theatreId: string): Promise<string | null>;
}
