import type { ReviewTheatreOwnerRequestInput } from "@ticketverse/schemas";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError.js";
import type { TheatreOwnerRequestRepository } from "../domain/ports/TheatreOwnerRequestRepository.js";
import type { UserRepository } from "../domain/ports/UserRepository.js";
import type { TheatreProvisioningPort } from "../domain/ports/TheatreProvisioningPort.js";

/**
 * Admin approves/rejects a theatre-owner request. Approval promotes the user's role,
 * bumps tokenVersion to force re-auth, and provisions their Theatre via the injected port.
 */
export function makeReviewTheatreOwnerRequest(
  requestRepo: TheatreOwnerRequestRepository,
  userRepo: UserRepository,
  theatreProvisioning: TheatreProvisioningPort,
) {
  return async function reviewTheatreOwnerRequest(
    requestId: string,
    input: ReviewTheatreOwnerRequestInput,
  ): Promise<void> {
    const request = await requestRepo.findById(requestId);
    if (!request) {
      throw new NotFoundError("Theatre owner request not found");
    }
    if (request.status !== "pending") {
      throw new ConflictError("Request has already been reviewed");
    }

    await requestRepo.updateStatus(requestId, input.decision);

    if (input.decision === "approved") {
      await userRepo.updateRole(request.userId, "theatre_owner");
      await userRepo.incrementTokenVersion(request.userId);
      await theatreProvisioning.provisionTheatreForOwner({
        ownerId: request.userId,
        name: request.theatreName,
        city: request.city,
      });
    }
  };
}
