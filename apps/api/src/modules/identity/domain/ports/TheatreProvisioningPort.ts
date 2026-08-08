/**
 * Anti-corruption port so the `identity` module can trigger Theatre creation on
 * owner-request approval without depending on the `theatre` module's internals.
 * Wired to a real implementation once the `theatre` module exists (see routes composition).
 */
export interface TheatreProvisioningPort {
  provisionTheatreForOwner(params: {
    ownerId: string;
    name: string;
    city: string;
  }): Promise<void>;
}
