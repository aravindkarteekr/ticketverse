import type { HydratedDocument } from "mongoose";
import type { BookingStatus } from "@ticketverse/schemas";
import type { BookingRepository } from "../domain/ports/BookingRepository.js";
import type { BookingEntity, NewBooking } from "../domain/Booking.js";
import { BookingModel, type BookingDocument } from "./BookingModel.js";

function toEntity(doc: HydratedDocument<BookingDocument>): BookingEntity {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    showId: doc.showId.toString(),
    seatIds: doc.seatIds,
    status: doc.status as BookingStatus,
    totalAmount: doc.totalAmount,
    holdId: doc.holdId,
    createdAt: doc.createdAt as unknown as Date,
  };
}

export class MongoBookingRepository implements BookingRepository {
  async create(booking: NewBooking): Promise<BookingEntity> {
    const doc = await BookingModel.create(booking);
    return toEntity(doc);
  }

  async findById(id: string): Promise<BookingEntity | null> {
    const doc = await BookingModel.findById(id);
    return doc ? toEntity(doc) : null;
  }

  async findByUserId(userId: string, params: { page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;
    const [docs, total] = await Promise.all([
      BookingModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(params.limit),
      BookingModel.countDocuments({ userId }),
    ]);
    return { items: docs.map(toEntity), total };
  }

  async list(params: { page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;
    const [docs, total] = await Promise.all([
      BookingModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(params.limit),
      BookingModel.countDocuments(),
    ]);
    return { items: docs.map(toEntity), total };
  }

  async updateStatus(
    id: string,
    status: BookingStatus,
  ): Promise<BookingEntity | null> {
    const doc = await BookingModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );
    return doc ? toEntity(doc) : null;
  }

  async findBookedSeatIds(showId: string): Promise<string[]> {
    const docs = await BookingModel.find({
      showId,
      status: "confirmed",
    }).select("seatIds");
    return docs.flatMap((d) => d.seatIds);
  }
}
