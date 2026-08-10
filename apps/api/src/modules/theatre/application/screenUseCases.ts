import {
  ForbiddenError,
  NotFoundError,
} from "../../../shared/errors/AppError.js";
import type { CreateScreenInput } from "@ticketverse/schemas";
import type { ScreenRepository } from "../domain/ports/ScreenRepository.js";
import type { TheatreRepository } from "../domain/ports/TheatreRepository.js";
import { assertOwnership } from "./theatreUseCases.js";

export function makeCreateScreen(
  screenRepo: ScreenRepository,
  theatreRepo: TheatreRepository,
) {
  return async (
    theatreId: string,
    ownerId: string,
    input: CreateScreenInput,
  ) => {
    await assertOwnership(theatreRepo, theatreId, ownerId);
    return screenRepo.create({
      theatreId,
      name: input.name,
      layout: input.layout,
    });
  };
}

export function makeListScreens(screenRepo: ScreenRepository) {
  return (theatreId: string) => screenRepo.findByTheatreId(theatreId);
}

export function makeDeleteScreen(
  screenRepo: ScreenRepository,
  theatreRepo: TheatreRepository,
) {
  return async (screenId: string, ownerId: string) => {
    const screen = await screenRepo.findById(screenId);
    if (!screen) throw new NotFoundError("Screen not found");
    const theatre = await theatreRepo.findById(screen.theatreId);
    if (!theatre || theatre.ownerId !== ownerId) {
      throw new ForbiddenError("You do not own this screen's theatre");
    }
    await screenRepo.delete(screenId);
  };
}
