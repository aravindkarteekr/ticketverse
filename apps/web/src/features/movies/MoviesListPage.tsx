import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { searchMovies } from "./moviesApi.js";

export function MoviesListPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["movies", q],
    queryFn: () => searchMovies({ q: q || undefined }),
  });

  return (
    <Box maxWidth={1000} mx="auto" mt={4} px={2}>
      <Typography variant="h5" mb={2}>
        Now Showing
      </Typography>
      <TextField
        label="Search movies"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />
      {isLoading && <CircularProgress />}
      <Grid container spacing={2}>
        {data?.items.map((movie) => (
          <Grid item xs={12} sm={6} md={4} key={movie.id}>
            <Card>
              <CardActionArea component={RouterLink} to={`/movies/${movie.id}`}>
                {movie.posterUrl && <CardMedia component="img" height={280} image={movie.posterUrl} alt={movie.title} />}
                <CardContent>
                  <Typography variant="subtitle1">{movie.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {movie.language} · {movie.durationMinutes} min
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      {!isLoading && data?.items.length === 0 && <Typography>No movies found.</Typography>}
    </Box>
  );
}
