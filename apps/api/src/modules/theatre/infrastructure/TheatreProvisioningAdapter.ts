import type { TheatreProvisioningPort } from "../../identity/domain/ports/TheatreProvisioningPort.js";
import type { TheatreRepository } from "../domain/ports/TheatreRepository.js";

/** Real implementation of identity's provisioning port, backed by the theatre module's repository. */
export class TheatreProvisioningAdapter implements TheatreProvisioningPort {
  constructor(private readonly theatreRepo: TheatreRepository) {}

  async provisionTheatreForOwner(params: {
    ownerId: string;
    name: string;
    city: string;
  }): Promise<void> {
    await this.theatreRepo.create({
      ownerId: params.ownerId,
      name: params.name,
      city: params.city,
      address: "",
    });
  }
}
