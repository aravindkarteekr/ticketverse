import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import { ErrorState } from "../../components/ErrorState.js";
import { EmptyState } from "../../components/EmptyState.js";
import { listUsers, listAdminTheatres, listAdminBookings } from "./adminApi.js";

const PAGE_SIZE = 10;

export function UsersAdminPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => listUsers({ page, limit: PAGE_SIZE }),
  });

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Users
      </Typography>
      {isLoading && <CircularProgress />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState message="No users found." />
      )}
      {data && data.items.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {data && (
        <Pagination
          sx={{ mt: 2 }}
          count={Math.max(1, Math.ceil(data.total / PAGE_SIZE))}
          page={page}
          onChange={(_e, value) => setPage(value)}
        />
      )}
    </Box>
  );
}

export function TheatresAdminPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "theatres", page],
    queryFn: () => listAdminTheatres({ page, limit: PAGE_SIZE }),
  });

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Theatres
      </Typography>
      {isLoading && <CircularProgress />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState message="No theatres found." />
      )}
      {data && data.items.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.map((theatre) => (
              <TableRow key={theatre.id}>
                <TableCell>{theatre.name}</TableCell>
                <TableCell>{theatre.city}</TableCell>
                <TableCell>{theatre.address}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {data && (
        <Pagination
          sx={{ mt: 2 }}
          count={Math.max(1, Math.ceil(data.total / PAGE_SIZE))}
          page={page}
          onChange={(_e, value) => setPage(value)}
        />
      )}
    </Box>
  );
}

export function BookingsAdminPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "bookings", page],
    queryFn: () => listAdminBookings({ page, limit: PAGE_SIZE }),
  });

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Bookings
      </Typography>
      {isLoading && <CircularProgress />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState message="No bookings found." />
      )}
      {data && data.items.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Seats</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.seatIds.join(", ")}</TableCell>
                <TableCell>₹{booking.totalAmount}</TableCell>
                <TableCell>{booking.status}</TableCell>
                <TableCell>
                  {new Date(booking.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {data && (
        <Pagination
          sx={{ mt: 2 }}
          count={Math.max(1, Math.ceil(data.total / PAGE_SIZE))}
          page={page}
          onChange={(_e, value) => setPage(value)}
        />
      )}
    </Box>
  );
}
