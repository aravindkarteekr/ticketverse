import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useAppSelector } from "../app/hooks.js";

export function HomePage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <Box maxWidth={800} mx="auto" mt={8} px={2} textAlign="center">
      <Typography variant="h3" gutterBottom>
        TicketVerse
      </Typography>
      <Typography variant="h6" color="text.secondary" mb={4}>
        Browse movies, pick your seats, and book tickets in a few clicks.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
        <Button
          variant="contained"
          size="large"
          component={RouterLink}
          to="/movies"
        >
          Browse movies
        </Button>
        {user ? (
          <Button
            variant="outlined"
            size="large"
            component={RouterLink}
            to="/bookings/mine"
          >
            My bookings
          </Button>
        ) : (
          <Button
            variant="outlined"
            size="large"
            component={RouterLink}
            to="/signup"
          >
            Create an account
          </Button>
        )}
      </Stack>
    </Box>
  );
}
