import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { signupSchema, type SignupInput } from "@ticketverse/schemas";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import { useAppDispatch } from "../../app/hooks.js";
import { authResolved } from "../../app/authSlice.js";
import { signupRequest } from "./authApi.js";

export function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const mutation = useMutation({
    mutationFn: signupRequest,
    onSuccess: (user) => {
      dispatch(authResolved(user));
      navigate("/");
    },
  });

  return (
    <Box maxWidth={400} mx="auto" mt={8} px={2}>
      <Typography variant="h5" mb={3}>
        Sign up
      </Typography>
      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not create account. Email may already be in use.
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit((input) => mutation.mutate(input))} display="grid" gap={2}>
        <TextField
          label="Name"
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
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
          Sign up
        </Button>
      </Box>
      <Typography mt={2}>
        Already have an account? <Link component={RouterLink} to="/login">Log in</Link>
      </Typography>
    </Box>
  );
}
