import type { HydratedDocument } from "mongoose";
import type {
  ShowRepository,
  ShowSearchParams,
} from "../domain/ports/ShowRepository.js";
import type {
  NewShow,
  ShowEntity,
  ShowUpdate,
  SeatPricing,
} from "../domain/Show.js";
import { ShowModel, type ShowDocument } from "./ShowModel.js";

function toEntity(doc: HydratedDocument<ShowDocument>): ShowEntity {
  return {
    id: doc._id.toString(),
    movieId: doc.movieId.toString(),
    screenId: doc.screenId.toString(),
    theatreId: doc.theatreId.toString(),
    startTime: doc.startTime,
    pricing: doc.pricing.map((p): SeatPricing => ({
      seatType: p.seatType as SeatPricing["seatType"],
      price: p.price,
    })),
    createdAt: doc.createdAt as unknown as Date,
  };
}

export class MongoShowRepository implements ShowRepository {
  async create(show: NewShow): Promise<ShowEntity> {
    const doc = await ShowModel.create(show);
    return toEntity(doc);
  }

  async findById(id: string): Promise<ShowEntity | null> {
    const doc = await ShowModel.findById(id);
    return doc ? toEntity(doc) : null;
  }

  async update(id: string, update: ShowUpdate): Promise<ShowEntity | null> {
    const doc = await ShowModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    );
    return doc ? toEntity(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await ShowModel.deleteOne({ _id: id });
  }

  async search(params: ShowSearchParams) {
    const filter: Record<string, unknown> = {};
    if (params.movieId) filter.movieId = params.movieId;
    if (params.theatreIds) filter.theatreId = { $in: params.theatreIds };
    if (params.date) {
      const start = new Date(params.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.startTime = { $gte: start, $lt: end };
    }

    const skip = (params.page - 1) * params.limit;
    const [docs, total] = await Promise.all([
      ShowModel.find(filter)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(params.limit),
      ShowModel.countDocuments(filter),
    ]);
    return { items: docs.map(toEntity), total };
  }

  async findByTheatreId(theatreId: string): Promise<ShowEntity[]> {
    const docs = await ShowModel.find({ theatreId }).sort({ startTime: 1 });
    return docs.map(toEntity);
  }
}
