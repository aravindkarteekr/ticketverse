import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import { ErrorState } from "../../components/ErrorState.js";
import { EmptyState } from "../../components/EmptyState.js";
import { listMyBookings } from "./bookingApi.js";

const PAGE_SIZE = 10;

export function MyBookingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-bookings", page],
    queryFn: () => listMyBookings({ page, limit: PAGE_SIZE }),
  });

  return (
    <Box maxWidth={700} mx="auto" mt={4} px={2}>
      <Typography variant="h5" mb={2}>
        My bookings
      </Typography>
      {isLoading && <CircularProgress />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState message="You haven't booked any tickets yet." />
      )}
      {data && data.items.length > 0 && (
        <>
          <List>
            {data.items.map((booking) => (
              <ListItem
                key={booking.id}
                divider
                component={RouterLink}
                to={
                  booking.status === "pending_payment"
                    ? `/payment/${booking.id}`
                    : "#"
                }
                sx={{ color: "inherit", textDecoration: "none" }}
              >
                <ListItemText
                  primary={`Seats: ${booking.seatIds.join(", ")}`}
                  secondary={`₹${booking.totalAmount} · ${new Date(booking.createdAt).toLocaleString()}`}
                />
                <Chip
                  label={booking.status}
                  color={
                    booking.status === "confirmed"
                      ? "success"
                      : booking.status === "cancelled" ||
                          booking.status === "expired"
                        ? "default"
                        : "warning"
                  }
                  size="small"
                />
              </ListItem>
            ))}
          </List>
          <Pagination
            count={Math.max(1, Math.ceil(data.total / PAGE_SIZE))}
            page={page}
            onChange={(_e, value) => setPage(value)}
          />
        </>
      )}
    </Box>
  );
}
