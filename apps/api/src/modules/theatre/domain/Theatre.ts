export interface TheatreEntity {
  id: string;
  ownerId: string;
  name: string;
  city: string;
  address: string;
  createdAt: Date;
}

export type NewTheatre = Omit<TheatreEntity, "id" | "createdAt">;
export type TheatreUpdate = Partial<
  Pick<TheatreEntity, "name" | "city" | "address">
>;
