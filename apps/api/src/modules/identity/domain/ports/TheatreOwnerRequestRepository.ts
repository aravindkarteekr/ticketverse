import type { TheatreOwnerRequestStatus } from "@ticketverse/schemas";
import type {
  NewTheatreOwnerRequest,
  TheatreOwnerRequestEntity,
} from "../TheatreOwnerRequest.js";

/** Repository port — infrastructure provides the Mongoose-backed implementation. */
export interface TheatreOwnerRequestRepository {
  create(request: NewTheatreOwnerRequest): Promise<TheatreOwnerRequestEntity>;
  findById(id: string): Promise<TheatreOwnerRequestEntity | null>;
  listByStatus(status: TheatreOwnerRequestStatus): Promise<TheatreOwnerRequestEntity[]>;
  updateStatus(id: string, status: TheatreOwnerRequestStatus): Promise<void>;
}
