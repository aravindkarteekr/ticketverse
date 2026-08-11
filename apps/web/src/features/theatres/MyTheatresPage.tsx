import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Theatre } from "@ticketverse/schemas";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import { ErrorState } from "../../components/ErrorState.js";
import { EmptyState } from "../../components/EmptyState.js";
import { listMyTheatres, updateTheatre } from "./theatresApi.js";

function TheatreCard({ theatre }: { theatre: Theatre }) {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState(theatre.address);
  const mutation = useMutation({
    mutationFn: () => updateTheatre(theatre.id, { address }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["myTheatres"] }),
  });

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">{theatre.name}</Typography>
        <Typography color="text.secondary" mb={2}>
          {theatre.city}
        </Typography>
        <TextField
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          size="small"
        />
        {mutation.isError && <ErrorState error={mutation.error} />}
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          Save address
        </Button>
        <Button
          size="small"
          component={RouterLink}
          to={`/theatres/${theatre.id}/screens`}
        >
          Manage screens
        </Button>
        <Button
          size="small"
          component={RouterLink}
          to={`/theatres/${theatre.id}/shows`}
        >
          Schedule shows
        </Button>
      </CardActions>
    </Card>
  );
}

export function MyTheatresPage() {
  const {
    data: theatres,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["myTheatres"],
    queryFn: listMyTheatres,
  });

  return (
    <Box maxWidth={700} mx="auto" mt={4} px={2}>
      <Typography variant="h5" mb={3}>
        My theatres
      </Typography>
      {isLoading && <CircularProgress />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      <Stack>
        {theatres?.map((theatre) => (
          <TheatreCard key={theatre.id} theatre={theatre} />
        ))}
      </Stack>
      {!isLoading && !isError && theatres?.length === 0 && (
        <EmptyState message="You don't have any theatres yet. Submit a request to become a theatre owner." />
      )}
    </Box>
  );
}
