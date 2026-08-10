import { useMutation } from "@tanstack/react-query";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { loggedOut } from "../app/authSlice.js";
import { logoutRequest } from "../features/auth/authApi.js";

export function NavBar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      dispatch(loggedOut());
      navigate("/");
    },
  });

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, color: "inherit", textDecoration: "none" }}
        >
          TicketVerse
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Button color="inherit" component={RouterLink} to="/movies">
            Movies
          </Button>
          {user && (
            <Button color="inherit" component={RouterLink} to="/bookings/mine">
              My bookings
            </Button>
          )}
          {user?.role === "theatre_owner" && (
            <Button color="inherit" component={RouterLink} to="/theatres/mine">
              My theatres
            </Button>
          )}
          {user?.role === "user" && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/theatres/request"
            >
              Become an owner
            </Button>
          )}
          {user?.role === "admin" && (
            <Button color="inherit" component={RouterLink} to="/admin">
              Admin
            </Button>
          )}
          {user ? (
            <>
              <Typography variant="body2">{user.name}</Typography>
              <Button color="inherit" onClick={() => logoutMutation.mutate()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Log in
              </Button>
              <Button color="inherit" component={RouterLink} to="/signup">
                Sign up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
