import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { loginSchema, type LoginInput } from "@ticketverse/schemas";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import { useAppDispatch } from "../../app/hooks.js";
import { authResolved } from "../../app/authSlice.js";
import { loginRequest } from "./authApi.js";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (user) => {
      dispatch(authResolved(user));
      navigate("/");
    },
  });

  return (
    <Box maxWidth={400} mx="auto" mt={8} px={2}>
      <Typography variant="h5" mb={3}>
        Log in
      </Typography>
      {mutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Invalid email or password.</Alert>}
      <Box component="form" onSubmit={handleSubmit((input) => mutation.mutate(input))} display="grid" gap={2}>
        <TextField
          label="Email"
          type="email"
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          label="Password"
          type="password"
          {...register("password")}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <Button type="submit" variant="contained" disabled={mutation.isPending}>
          Log in
        </Button>
      </Box>
      <Typography mt={2}>
        No account? <Link component={RouterLink} to="/signup">Sign up</Link>
      </Typography>
    </Box>
  );
}
