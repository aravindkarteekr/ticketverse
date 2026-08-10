import type { HydratedDocument } from "mongoose";
import type { TheatreRepository } from "../domain/ports/TheatreRepository.js";
import type {
  NewTheatre,
  TheatreEntity,
  TheatreUpdate,
} from "../domain/Theatre.js";
import { TheatreModel, type TheatreDocument } from "./TheatreModel.js";

function toEntity(doc: HydratedDocument<TheatreDocument>): TheatreEntity {
  return {
    id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    name: doc.name,
    city: doc.city,
    address: doc.address,
    createdAt: doc.createdAt as unknown as Date,
  };
}

export class MongoTheatreRepository implements TheatreRepository {
  async create(theatre: NewTheatre): Promise<TheatreEntity> {
    const doc = await TheatreModel.create(theatre);
    return toEntity(doc);
  }

  async findById(id: string): Promise<TheatreEntity | null> {
    const doc = await TheatreModel.findById(id);
    return doc ? toEntity(doc) : null;
  }

  async findByOwnerId(ownerId: string): Promise<TheatreEntity[]> {
    const docs = await TheatreModel.find({ ownerId });
    return docs.map(toEntity);
  }

  async update(
    id: string,
    update: TheatreUpdate,
  ): Promise<TheatreEntity | null> {
    const doc = await TheatreModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    );
    return doc ? toEntity(doc) : null;
  }

  async list(params: { page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;
    const [docs, total] = await Promise.all([
      TheatreModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(params.limit),
      TheatreModel.countDocuments(),
    ]);
    return { items: docs.map(toEntity), total };
  }
}
