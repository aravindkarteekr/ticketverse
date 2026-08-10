import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { SeatAvailability } from "@ticketverse/schemas";
import { SeatMapPage } from "./SeatMapPage.js";

const { getSeatAvailability, holdSeats, createBooking } = vi.hoisted(() => ({
  getSeatAvailability: vi.fn(),
  holdSeats: vi.fn(),
  createBooking: vi.fn(),
}));

vi.mock("./bookingApi.js", () => ({ getSeatAvailability, holdSeats, createBooking }));

// 11 available seats in row A so we can verify the MAX_SEATS=10 client-side cap.
const elevenAvailableSeats: SeatAvailability[] = Array.from({ length: 11 }, (_, i) => ({
  seatId: `A${i + 1}`,
  seatType: "regular",
  price: 100,
  status: "available",
}));

function renderSeatMap() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/shows/show-1"]}>
        <Routes>
          <Route path="/shows/:id" element={<SeatMapPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SeatMapPage seat selection logic", () => {
  it("selects an available seat, updates the total, and toggles it off on a second click", async () => {
    getSeatAvailability.mockResolvedValue(elevenAvailableSeats);
    const user = userEvent.setup();

    renderSeatMap();

    const seatA1 = await screen.findByText("A1");
    await user.click(seatA1);
    expect(screen.getByText("Selected: A1")).toBeInTheDocument();
    expect(screen.getByText("Total: ₹100")).toBeInTheDocument();

    await user.click(seatA1);
    expect(screen.getByText("Selected: none")).toBeInTheDocument();
    expect(screen.getByText("Total: ₹0")).toBeInTheDocument();
  });

  it("caps selection at MAX_SEATS (10) and ignores further clicks", async () => {
    getSeatAvailability.mockResolvedValue(elevenAvailableSeats);
    const user = userEvent.setup();

    renderSeatMap();

    for (let i = 1; i <= 11; i++) {
      await user.click(await screen.findByText(`A${i}`));
    }

    const selectedText = screen.getByText(/^Selected: /).textContent ?? "";
    const selectedCount = selectedText.replace("Selected: ", "").split(", ").length;
    expect(selectedCount).toBe(10);
    expect(selectedText).not.toContain("A11");
  });

  it("does not allow selecting a booked seat", async () => {
    getSeatAvailability.mockResolvedValue([
      { seatId: "A1", seatType: "regular", price: 100, status: "booked" },
    ] satisfies SeatAvailability[]);
    const user = userEvent.setup();

    renderSeatMap();

    await user.click(await screen.findByText("A1"));
    expect(screen.getByText("Selected: none")).toBeInTheDocument();
  });
});
