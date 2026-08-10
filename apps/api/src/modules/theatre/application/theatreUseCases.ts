import {
  ForbiddenError,
  NotFoundError,
} from "../../../shared/errors/AppError.js";
import type { TheatreUpdate } from "../domain/Theatre.js";
import type { TheatreRepository } from "../domain/ports/TheatreRepository.js";

async function assertOwnership(
  theatreRepo: TheatreRepository,
  theatreId: string,
  ownerId: string,
) {
  const theatre = await theatreRepo.findById(theatreId);
  if (!theatre) throw new NotFoundError("Theatre not found");
  if (theatre.ownerId !== ownerId)
    throw new ForbiddenError("You do not own this theatre");
  return theatre;
}

export function makeGetTheatre(theatreRepo: TheatreRepository) {
  return async (id: string) => {
    const theatre = await theatreRepo.findById(id);
    if (!theatre) throw new NotFoundError("Theatre not found");
    return theatre;
  };
}

export function makeListMyTheatres(theatreRepo: TheatreRepository) {
  return (ownerId: string) => theatreRepo.findByOwnerId(ownerId);
}

export function makeListAllTheatres(theatreRepo: TheatreRepository) {
  return (params: { page: number; limit: number }) => theatreRepo.list(params);
}

export function makeUpdateTheatre(theatreRepo: TheatreRepository) {
  return async (id: string, ownerId: string, update: TheatreUpdate) => {
    await assertOwnership(theatreRepo, id, ownerId);
    return theatreRepo.update(id, update);
  };
}

export { assertOwnership };
