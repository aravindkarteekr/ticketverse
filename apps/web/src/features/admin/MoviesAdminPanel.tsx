import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMovieSchema, type CreateMovieInput } from "@ticketverse/schemas";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import { ErrorState } from "../../components/ErrorState.js";
import { EmptyState } from "../../components/EmptyState.js";
import { getErrorMessage } from "../../lib/errors.js";
import { searchMovies } from "../movies/moviesApi.js";
import { createMovie, deleteMovie } from "./adminApi.js";

export function MoviesAdminPanel() {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: movies,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "movies"],
    queryFn: () => searchMovies({}),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMovieInput>({
    resolver: zodResolver(createMovieSchema),
    defaultValues: { genres: [] as unknown as string[] },
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateMovieInput) => createMovie(input),
    onSuccess: () => {
      reset();
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "movies"] });
    },
    onError: () =>
      setFormError("Failed to create movie. Check the fields and try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMovie(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "movies"] }),
  });

  function onSubmit(values: CreateMovieInput) {
    const genres =
      typeof values.genres === "string"
        ? (values.genres as unknown as string)
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
        : values.genres;
    createMutation.mutate({ ...values, genres });
  }

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Movies
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} mb={4}>
        <Stack spacing={2} maxWidth={500}>
          <TextField
            label="Title"
            {...register("title")}
            error={!!errors.title}
            helperText={errors.title?.message}
          />
          <TextField
            label="Description"
            multiline
            rows={3}
            {...register("description")}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
          <TextField
            label="Duration (minutes)"
            type="number"
            {...register("durationMinutes")}
            error={!!errors.durationMinutes}
            helperText={errors.durationMinutes?.message}
          />
          <TextField
            label="Genres (comma separated)"
            {...register("genres" as never)}
            error={!!errors.genres}
            helperText={errors.genres?.message}
          />
          <TextField
            label="Language"
            {...register("language")}
            error={!!errors.language}
            helperText={errors.language?.message}
          />
          <TextField
            label="Release date"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("releaseDate")}
            error={!!errors.releaseDate}
            helperText={errors.releaseDate?.message}
          />
          <TextField
            label="Poster URL (optional)"
            {...register("posterUrl")}
            error={!!errors.posterUrl}
            helperText={errors.posterUrl?.message}
          />
          {formError && <Typography color="error">{formError}</Typography>}
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending}
          >
            Add movie
          </Button>
        </Stack>
      </Box>

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}
      {deleteMutation.isError && (
        <Typography color="error" mb={1}>
          {getErrorMessage(
            deleteMutation.error,
            "Could not delete this movie. Please try again.",
          )}
        </Typography>
      )}
      {!isError && movies?.items.length === 0 && (
        <EmptyState message="No movies yet. Add one above." />
      )}
      <List>
        {movies?.items.map((movie) => (
          <ListItem
            key={movie.id}
            divider
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => deleteMutation.mutate(movie.id)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={movie.title}
              secondary={`${movie.language} · ${movie.durationMinutes} min`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
