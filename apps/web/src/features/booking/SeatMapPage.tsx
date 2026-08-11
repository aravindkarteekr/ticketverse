import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { SeatAvailability } from "@ticketverse/schemas";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { ErrorState } from "../../components/ErrorState.js";
import { getErrorMessage } from "../../lib/errors.js";
import { getSeatAvailability, holdSeats, createBooking } from "./bookingApi.js";

const SEAT_ID_PATTERN = /^([A-Za-z]+)(\d+)$/;
const MAX_SEATS = 10;

function groupByRow(
  seats: SeatAvailability[],
): Array<[string, SeatAvailability[]]> {
  const rows = new Map<string, SeatAvailability[]>();
  for (const seat of seats) {
    const match = SEAT_ID_PATTERN.exec(seat.seatId);
    const row = match ? match[1] : seat.seatId;
    const list = rows.get(row!) ?? [];
    list.push(seat);
    rows.set(row!, list);
  }
  return Array.from(rows.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function seatColor(status: SeatAvailability["status"], selected: boolean) {
  if (selected) return "primary.main";
  if (status === "booked") return "grey.400";
  if (status === "held") return "warning.light";
  return "success.light";
}

export function SeatMapPage() {
  const { id: showId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [hold, setHold] = useState<{
    holdId: string;
    expiresAt: string;
  } | null>(null);
  const [conflict, setConflict] = useState<string[]>([]);

  const {
    data: seats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["seats", showId],
    queryFn: () => getSeatAvailability(showId!),
    enabled: !!showId,
    refetchInterval: hold ? false : 10_000,
  });

  const rows = useMemo(() => groupByRow(seats ?? []), [seats]);
  const priceBySeatId = useMemo(
    () => new Map(seats?.map((s) => [s.seatId, s.price]) ?? []),
    [seats],
  );
  const total = selected.reduce(
    (sum, seatId) => sum + (priceBySeatId.get(seatId) ?? 0),
    0,
  );

  const holdMutation = useMutation({
    mutationFn: () => holdSeats(showId!, selected),
    onSuccess: (result) => {
      if (result.unavailableSeatIds.length > 0) {
        setConflict(result.unavailableSeatIds);
        setSelected((prev) =>
          prev.filter((seatId) => !result.unavailableSeatIds.includes(seatId)),
        );
        return;
      }
      setConflict([]);
      setHold({
        holdId: result.holdId,
        expiresAt: result.expiresAt as unknown as string,
      });
    },
  });

  const bookingMutation = useMutation({
    mutationFn: () => createBooking(showId!, hold!.holdId, selected),
    onSuccess: (booking) => navigate(`/payment/${booking.id}`),
  });

  function toggleSeat(seat: SeatAvailability) {
    if (hold || seat.status !== "available") return;
    setSelected((prev) => {
      if (prev.includes(seat.seatId))
        return prev.filter((s) => s !== seat.seatId);
      if (prev.length >= MAX_SEATS) return prev;
      return [...prev, seat.seatId];
    });
  }

  if (isLoading) return <CircularProgress sx={{ m: 4 }} />;
  if (isError) {
    return (
      <Box maxWidth={800} mx="auto" mt={4} px={2}>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Box>
    );
  }

  return (
    <Box maxWidth={800} mx="auto" mt={4} px={2}>
      <Typography variant="h5" mb={2}>
        Select seats
      </Typography>

      {conflict.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          These seats were just taken by someone else: {conflict.join(", ")}.
          Please choose again.
        </Alert>
      )}

      {holdMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(
            holdMutation.error,
            "Could not hold these seats. Please try again.",
          )}
        </Alert>
      )}
      {bookingMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(
            bookingMutation.error,
            "Could not confirm this booking. Please try again.",
          )}
        </Alert>
      )}

      <Stack spacing={1} mb={3}>
        {rows.map(([row, rowSeats]) => (
          <Stack key={row} direction="row" spacing={1} alignItems="center">
            <Typography width={24}>{row}</Typography>
            {rowSeats
              .sort((a, b) =>
                a.seatId.localeCompare(b.seatId, undefined, { numeric: true }),
              )
              .map((seat) => (
                <Box
                  key={seat.seatId}
                  onClick={() => toggleSeat(seat)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    cursor:
                      seat.status === "available" && !hold
                        ? "pointer"
                        : "default",
                    bgcolor: seatColor(
                      seat.status,
                      selected.includes(seat.seatId),
                    ),
                    color: selected.includes(seat.seatId)
                      ? "white"
                      : "text.primary",
                  }}
                >
                  {seat.seatId}
                </Box>
              ))}
          </Stack>
        ))}
      </Stack>

      <Typography mb={1}>Selected: {selected.join(", ") || "none"}</Typography>
      <Typography variant="h6" mb={2}>
        Total: ₹{total}
      </Typography>

      {!hold ? (
        <Button
          variant="contained"
          disabled={selected.length === 0 || holdMutation.isPending}
          onClick={() => holdMutation.mutate()}
        >
          Hold seats
        </Button>
      ) : (
        <Stack spacing={1}>
          <Alert severity="info">
            Seats held until {new Date(hold.expiresAt).toLocaleTimeString()} —
            confirm your booking before then.
          </Alert>
          <Button
            variant="contained"
            disabled={bookingMutation.isPending}
            onClick={() => bookingMutation.mutate()}
          >
            Confirm booking
          </Button>
        </Stack>
      )}
    </Box>
  );
}
