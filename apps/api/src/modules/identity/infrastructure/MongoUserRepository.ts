import type { HydratedDocument } from "mongoose";
import type { Role } from "@ticketverse/schemas";
import type { UserRepository } from "../domain/ports/UserRepository.js";
import type { NewUser, UserEntity } from "../domain/User.js";
import { UserModel, type UserDocument } from "./UserModel.js";

function toEntity(doc: HydratedDocument<UserDocument>): UserEntity {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role as Role,
    tokenVersion: doc.tokenVersion,
    createdAt: doc.createdAt as unknown as Date,
  };
}

export class MongoUserRepository implements UserRepository {
  async create(user: NewUser): Promise<UserEntity> {
    const doc = await UserModel.create(user);
    return toEntity(doc);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findById(id);
    return doc ? toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ email });
    return doc ? toEntity(doc) : null;
  }

  async updateRole(id: string, role: Role): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { role } });
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } });
  }

  async list(params: { page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;
    const [docs, total] = await Promise.all([
      UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(params.limit),
      UserModel.countDocuments(),
    ]);
    return { items: docs.map(toEntity), total };
  }
}
