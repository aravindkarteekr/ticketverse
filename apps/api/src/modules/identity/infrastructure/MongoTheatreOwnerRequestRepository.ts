import type { HydratedDocument } from "mongoose";
import type { TheatreOwnerRequestStatus } from "@ticketverse/schemas";
import type { TheatreOwnerRequestRepository } from "../domain/ports/TheatreOwnerRequestRepository.js";
import type {
  NewTheatreOwnerRequest,
  TheatreOwnerRequestEntity,
} from "../domain/TheatreOwnerRequest.js";
import {
  TheatreOwnerRequestModel,
  type TheatreOwnerRequestDocument,
} from "./TheatreOwnerRequestModel.js";

function toEntity(
  doc: HydratedDocument<TheatreOwnerRequestDocument>,
): TheatreOwnerRequestEntity {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    theatreName: doc.theatreName,
    city: doc.city,
    reason: doc.reason ?? undefined,
    status: doc.status as TheatreOwnerRequestStatus,
    createdAt: doc.createdAt as unknown as Date,
  };
}

export class MongoTheatreOwnerRequestRepository implements TheatreOwnerRequestRepository {
  async create(
    request: NewTheatreOwnerRequest,
  ): Promise<TheatreOwnerRequestEntity> {
    const doc = await TheatreOwnerRequestModel.create(request);
    return toEntity(doc);
  }

  async findById(id: string): Promise<TheatreOwnerRequestEntity | null> {
    const doc = await TheatreOwnerRequestModel.findById(id);
    return doc ? toEntity(doc) : null;
  }

  async listByStatus(
    status: TheatreOwnerRequestStatus,
  ): Promise<TheatreOwnerRequestEntity[]> {
    const docs = await TheatreOwnerRequestModel.find({ status }).sort({
      createdAt: -1,
    });
    return docs.map(toEntity);
  }

  async updateStatus(
    id: string,
    status: TheatreOwnerRequestStatus,
  ): Promise<void> {
    await TheatreOwnerRequestModel.updateOne({ _id: id }, { $set: { status } });
  }
}
