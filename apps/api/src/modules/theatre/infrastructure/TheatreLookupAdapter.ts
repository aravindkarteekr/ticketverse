import type { TheatreLookupPort } from "../../show/domain/ports/TheatreLookupPort.js";
import { TheatreModel } from "./TheatreModel.js";
import { ScreenModel } from "./ScreenModel.js";

/** Real implementation of show's theatre-lookup port, backed by this module's Mongoose models. */
export class TheatreLookupAdapter implements TheatreLookupPort {
  async findTheatreIdsByCity(city: string): Promise<string[]> {
    const docs = await TheatreModel.find({ city }).select("_id");
    return docs.map((d) => d._id.toString());
  }

  async getScreenContext(screenId: string): Promise<{ theatreId: string; ownerId: string } | null> {
    const screen = await ScreenModel.findById(screenId);
    if (!screen) return null;
    const theatre = await TheatreModel.findById(screen.theatreId);
    if (!theatre) return null;
    return { theatreId: theatre._id.toString(), ownerId: theatre.ownerId.toString() };
  }

  async getTheatreOwnerId(theatreId: string): Promise<string | null> {
    const theatre = await TheatreModel.findById(theatreId);
    return theatre ? theatre.ownerId.toString() : null;
  }
}
