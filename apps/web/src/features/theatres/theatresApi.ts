import type { Theatre, CreateTheatreOwnerRequestInput, UpdateTheatreInput, CreateScreenInput, Screen } from "@ticketverse/schemas";
import { apiClient } from "../../lib/axiosClient.js";

export async function getTheatre(id: string): Promise<Theatre> {
  const { data } = await apiClient.get<Theatre>(`/theatres/${id}`);
  return data;
}

export async function requestTheatreOwner(input: CreateTheatreOwnerRequestInput): Promise<void> {
  await apiClient.post("/theatre-owner-requests", input);
}

export async function listMyTheatres(): Promise<Theatre[]> {
  const { data } = await apiClient.get<Theatre[]>("/theatres/mine");
  return data;
}

export async function updateTheatre(id: string, input: UpdateTheatreInput): Promise<Theatre> {
  const { data } = await apiClient.patch<Theatre>(`/theatres/${id}`, input);
  return data;
}

export async function listScreens(theatreId: string): Promise<Screen[]> {
  const { data } = await apiClient.get<Screen[]>(`/theatres/${theatreId}/screens`);
  return data;
}

export async function createScreen(theatreId: string, input: CreateScreenInput): Promise<Screen> {
  const { data } = await apiClient.post<Screen>(`/theatres/${theatreId}/screens`, input);
  return data;
}

export async function deleteScreen(screenId: string): Promise<void> {
  await apiClient.delete(`/screens/${screenId}`);
}
