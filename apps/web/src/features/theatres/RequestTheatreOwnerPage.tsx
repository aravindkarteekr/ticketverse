import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  createTheatreOwnerRequestSchema,
  type CreateTheatreOwnerRequestInput,
} from "@ticketverse/schemas";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { requestTheatreOwner } from "./theatresApi.js";

export function RequestTheatreOwnerPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTheatreOwnerRequestInput>({
    resolver: zodResolver(createTheatreOwnerRequestSchema),
  });

  const mutation = useMutation({ mutationFn: requestTheatreOwner });

  return (
    <Box maxWidth={480} mx="auto" mt={8} px={2}>
      <Typography variant="h5" mb={3}>
        Become a theatre owner
      </Typography>
      {mutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Request submitted. An admin will review it shortly.
        </Alert>
      )}
      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not submit request.
        </Alert>
      )}
      <Box
        component="form"
        onSubmit={handleSubmit((input) => mutation.mutate(input))}
        display="grid"
        gap={2}
      >
        <TextField
          label="Theatre name"
          {...register("theatreName")}
          error={!!errors.theatreName}
          helperText={errors.theatreName?.message}
        />
        <TextField
          label="City"
          {...register("city")}
          error={!!errors.city}
          helperText={errors.city?.message}
        />
        <TextField
          label="Reason (optional)"
          multiline
          minRows={3}
          {...register("reason")}
          error={!!errors.reason}
          helperText={errors.reason?.message}
        />
        <Button type="submit" variant="contained" disabled={mutation.isPending}>
          Submit request
        </Button>
      </Box>
    </Box>
  );
}
