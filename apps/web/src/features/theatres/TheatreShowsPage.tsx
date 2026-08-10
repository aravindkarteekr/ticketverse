import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SeatType } from "@ticketverse/schemas";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import { listScreens } from "./theatresApi.js";
import { searchMovies } from "../movies/moviesApi.js";
import { createShow, deleteShow, listShowsByTheatre } from "../movies/showsApi.js";

export function TheatreShowsPage() {
  const { theatreId } = useParams<{ theatreId: string }>();
  const queryClient = useQueryClient();

  const [screenId, setScreenId] = useState("");
  const [movieId, setMovieId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { data: screens } = useQuery({
    queryKey: ["screens", theatreId],
    queryFn: () => listScreens(theatreId!),
    enabled: !!theatreId,
  });
  const { data: movies } = useQuery({ queryKey: ["movies", "all"], queryFn: () => searchMovies({}) });
  const { data: shows, isLoading: isShowsLoading } = useQuery({
    queryKey: ["theatreShows", theatreId],
    queryFn: () => listShowsByTheatre(theatreId!),
    enabled: !!theatreId,
  });

  const selectedScreen = screens?.find((s) => s.id === screenId);
  const seatTypes = useMemo(
    () => Array.from(new Set(selectedScreen?.layout.map((row) => row.seatType) ?? [])),
    [selectedScreen],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      createShow({
        movieId,
        screenId,
        startTime: new Date(startTime),
        pricing: seatTypes.map((seatType) => ({
          seatType: seatType as SeatType,
          price: Number(prices[seatType] ?? 0),
        })),
      }),
    onSuccess: () => {
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["theatreShows", theatreId] });
    },
    onError: () => setFormError("Failed to schedule show. Check the fields and try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["theatreShows", theatreId] }),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!screenId || !movieId || !startTime || seatTypes.some((t) => !prices[t])) {
      setFormError("Please fill in every field, including a price for each seat type.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <Box maxWidth={700} mx="auto" mt={4} px={2}>
      <Typography variant="h5" mb={3}>
        Schedule shows
      </Typography>

      <Box component="form" onSubmit={handleSubmit} mb={4}>
        <Stack spacing={2}>
          <TextField select label="Screen" value={screenId} onChange={(e) => setScreenId(e.target.value)}>
            {screens?.map((screen) => (
              <MenuItem key={screen.id} value={screen.id}>
                {screen.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Movie" value={movieId} onChange={(e) => setMovieId(e.target.value)}>
            {movies?.items.map((movie) => (
              <MenuItem key={movie.id} value={movie.id}>
                {movie.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Start time"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          {seatTypes.map((seatType) => (
            <TextField
              key={seatType}
              label={`Price — ${seatType}`}
              type="number"
              value={prices[seatType] ?? ""}
              onChange={(e) => setPrices((prev) => ({ ...prev, [seatType]: e.target.value }))}
            />
          ))}
          {formError && <Typography color="error">{formError}</Typography>}
          <Button type="submit" variant="contained" disabled={createMutation.isPending}>
            Schedule show
          </Button>
        </Stack>
      </Box>

      <Typography variant="h6" mb={1}>
        Scheduled shows
      </Typography>
      {isShowsLoading && <CircularProgress />}
      <List>
        {shows?.map((show) => (
          <ListItem
            key={show.id}
            divider
            secondaryAction={
              <IconButton edge="end" onClick={() => deleteMutation.mutate(show.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={new Date(show.startTime).toLocaleString()} secondary={`Screen: ${show.screenId}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
