import type { HydratedDocument } from "mongoose";
import type { ScreenRepository } from "../domain/ports/ScreenRepository.js";
import type { NewScreen, ScreenEntity } from "../domain/Screen.js";
import { ScreenModel, type ScreenDocument } from "./ScreenModel.js";

function toEntity(doc: HydratedDocument<ScreenDocument>): ScreenEntity {
  return {
    id: doc._id.toString(),
    theatreId: doc.theatreId.toString(),
    name: doc.name,
    layout: doc.layout.map((row) => ({
      row: row.row,
      seatCount: row.seatCount,
      seatType: row.seatType as ScreenEntity["layout"][number]["seatType"],
    })),
  };
}

export class MongoScreenRepository implements ScreenRepository {
  async create(screen: NewScreen): Promise<ScreenEntity> {
    const doc = await ScreenModel.create(screen);
    return toEntity(doc);
  }

  async findById(id: string): Promise<ScreenEntity | null> {
    const doc = await ScreenModel.findById(id);
    return doc ? toEntity(doc) : null;
  }

  async findByTheatreId(theatreId: string): Promise<ScreenEntity[]> {
    const docs = await ScreenModel.find({ theatreId });
    return docs.map(toEntity);
  }

  async delete(id: string): Promise<void> {
    await ScreenModel.deleteOne({ _id: id });
  }
}
