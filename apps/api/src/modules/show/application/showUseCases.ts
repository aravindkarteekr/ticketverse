import {
  ForbiddenError,
  NotFoundError,
} from "../../../shared/errors/AppError.js";
import type { CreateShowInput, UpdateShowInput } from "@ticketverse/schemas";
import type {
  ShowRepository,
  ShowSearchParams,
} from "../domain/ports/ShowRepository.js";
import type { TheatreLookupPort } from "../domain/ports/TheatreLookupPort.js";

export function makeCreateShow(
  showRepo: ShowRepository,
  theatreLookup: TheatreLookupPort,
) {
  return async (ownerId: string, input: CreateShowInput) => {
    const context = await theatreLookup.getScreenContext(input.screenId);
    if (!context) throw new NotFoundError("Screen not found");
    if (context.ownerId !== ownerId)
      throw new ForbiddenError("You do not own this screen");

    return showRepo.create({
      movieId: input.movieId,
      screenId: input.screenId,
      theatreId: context.theatreId,
      startTime: input.startTime,
      pricing: input.pricing,
    });
  };
}

export function makeUpdateShow(
  showRepo: ShowRepository,
  theatreLookup: TheatreLookupPort,
) {
  return async (id: string, ownerId: string, input: UpdateShowInput) => {
    const show = await showRepo.findById(id);
    if (!show) throw new NotFoundError("Show not found");

    const theatreOwnerId = await theatreLookup.getTheatreOwnerId(
      show.theatreId,
    );
    if (theatreOwnerId !== ownerId)
      throw new ForbiddenError("You do not own this show");

    return showRepo.update(id, {
      startTime: input.startTime,
      pricing: input.pricing,
    });
  };
}

export function makeDeleteShow(
  showRepo: ShowRepository,
  theatreLookup: TheatreLookupPort,
) {
  return async (id: string, ownerId: string) => {
    const show = await showRepo.findById(id);
    if (!show) throw new NotFoundError("Show not found");

    const theatreOwnerId = await theatreLookup.getTheatreOwnerId(
      show.theatreId,
    );
    if (theatreOwnerId !== ownerId)
      throw new ForbiddenError("You do not own this show");

    await showRepo.delete(id);
  };
}

export function makeGetShow(showRepo: ShowRepository) {
  return async (id: string) => {
    const show = await showRepo.findById(id);
    if (!show) throw new NotFoundError("Show not found");
    return show;
  };
}

export function makeSearchShows(
  showRepo: ShowRepository,
  theatreLookup: TheatreLookupPort,
) {
  return async (query: {
    movieId?: string;
    city?: string;
    date?: Date;
    page: number;
    limit: number;
  }) => {
    const params: ShowSearchParams = {
      movieId: query.movieId,
      date: query.date,
      page: query.page,
      limit: query.limit,
    };
    if (query.city) {
      params.theatreIds = await theatreLookup.findTheatreIdsByCity(query.city);
    }
    return showRepo.search(params);
  };
}

export function makeListShowsByTheatre(showRepo: ShowRepository) {
  return (theatreId: string) => showRepo.findByTheatreId(theatreId);
}
