import { useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { ErrorState } from "../../components/ErrorState.js";
import { EmptyState } from "../../components/EmptyState.js";
import { getMovie } from "./moviesApi.js";
import { searchShows } from "./showsApi.js";
import { getTheatre } from "../theatres/theatresApi.js";

function ShowRow({
  showId,
  theatreId,
  startTime,
}: {
  showId: string;
  theatreId: string;
  startTime: string;
}) {
  const { data: theatre } = useQuery({
    queryKey: ["theatre", theatreId],
    queryFn: () => getTheatre(theatreId),
  });

  return (
    <ListItemButton component={RouterLink} to={`/shows/${showId}`}>
      <ListItemText
        primary={
          theatre ? `${theatre.name} — ${theatre.city}` : "Loading theatre…"
        }
        secondary={new Date(startTime).toLocaleString()}
      />
    </ListItemButton>
  );
}

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [city, setCity] = useState("");

  const {
    data: movie,
    isLoading: isMovieLoading,
    isError: isMovieError,
    error: movieError,
    refetch: refetchMovie,
  } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => getMovie(id!),
    enabled: !!id,
  });

  const {
    data: shows,
    isLoading: isShowsLoading,
    isError: isShowsError,
    error: showsError,
    refetch: refetchShows,
  } = useQuery({
    queryKey: ["shows", id, city],
    queryFn: () => searchShows({ movieId: id, city: city || undefined }),
    enabled: !!id,
  });

  if (isMovieLoading) return <CircularProgress sx={{ m: 4 }} />;
  if (isMovieError) {
    return (
      <Box maxWidth={800} mx="auto" mt={4} px={2}>
        <ErrorState error={movieError} onRetry={() => refetchMovie()} />
      </Box>
    );
  }
  if (!movie) return <Typography m={4}>Movie not found.</Typography>;

  return (
    <Box maxWidth={800} mx="auto" mt={4} px={2}>
      <Typography variant="h4">{movie.title}</Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>
        {movie.language} · {movie.durationMinutes} min ·{" "}
        {new Date(movie.releaseDate).toLocaleDateString()}
      </Typography>
      <Stack direction="row" spacing={1} mb={2}>
        {movie.genres.map((genre) => (
          <Chip key={genre} label={genre} size="small" />
        ))}
      </Stack>
      <Typography mb={4}>{movie.description}</Typography>

      <Typography variant="h6" mb={1}>
        Showtimes
      </Typography>
      <TextField
        label="Filter by city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        size="small"
        sx={{ mb: 2 }}
      />
      {isShowsLoading && <CircularProgress />}
      {isShowsError && (
        <ErrorState error={showsError} onRetry={() => refetchShows()} />
      )}
      <List>
        {shows?.items.map((show) => (
          <ShowRow
            key={show.id}
            showId={show.id}
            theatreId={show.theatreId}
            startTime={show.startTime as unknown as string}
          />
        ))}
      </List>
      {!isShowsLoading && !isShowsError && shows?.items.length === 0 && (
        <EmptyState message="No showtimes found for this movie yet." />
      )}
    </Box>
  );
}
