import {
  isRouteErrorResponse,
  useRouteError,
  Link as RouterLink,
} from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

/** Router-level errorElement: handles unmatched routes (404) and uncaught route/render errors. */
export function RouteErrorPage() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  if (import.meta.env.DEV) {
    console.error("Route error:", error);
  }

  return (
    <Box textAlign="center" mt={10} px={2}>
      <Typography variant="h4" mb={1}>
        {isNotFound ? "Page not found" : "Something went wrong"}
      </Typography>
      <Typography color="text.secondary" mb={3}>
        {isNotFound
          ? "The page you're looking for doesn't exist."
          : "An unexpected error occurred. Please try again."}
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Go home
      </Button>
    </Box>
  );
}
