import type { CreateTheatreOwnerRequestInput } from "@ticketverse/schemas";
import { ConflictError } from "../../../shared/errors/AppError.js";
import type { TheatreOwnerRequestRepository } from "../domain/ports/TheatreOwnerRequestRepository.js";
import type { TheatreOwnerRequestEntity } from "../domain/TheatreOwnerRequest.js";

export function makeRequestTheatreOwner(
  requestRepo: TheatreOwnerRequestRepository,
) {
  return async function requestTheatreOwner(
    userId: string,
    input: CreateTheatreOwnerRequestInput,
  ): Promise<TheatreOwnerRequestEntity> {
    const pending = await requestRepo.listByStatus("pending");
    if (pending.some((r) => r.userId === userId)) {
      throw new ConflictError(
        "You already have a pending theatre-owner request",
      );
    }

    return requestRepo.create({
      userId,
      theatreName: input.theatreName,
      city: input.city,
      reason: input.reason,
    });
  };
}
