import { useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createScreenSchema,
  type CreateScreenInput,
} from "@ticketverse/schemas";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import { createScreen, deleteScreen, listScreens } from "./theatresApi.js";

const SEAT_TYPES = ["regular", "premium", "recliner"] as const;

export function TheatreScreensPage() {
  const { theatreId } = useParams<{ theatreId: string }>();
  const queryClient = useQueryClient();

  const { data: screens, isLoading } = useQuery({
    queryKey: ["screens", theatreId],
    queryFn: () => listScreens(theatreId!),
    enabled: !!theatreId,
  });

  const { register, control, handleSubmit, reset } = useForm<CreateScreenInput>(
    {
      resolver: zodResolver(createScreenSchema),
      defaultValues: {
        name: "",
        layout: [{ row: "A", seatCount: 10, seatType: "regular" }],
      },
    },
  );
  const { fields, append, remove } = useFieldArray({ control, name: "layout" });

  const createMutation = useMutation({
    mutationFn: (input: CreateScreenInput) => createScreen(theatreId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screens", theatreId] });
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScreen,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["screens", theatreId] }),
  });

  return (
    <Box maxWidth={700} mx="auto" mt={4} px={2}>
      <Typography variant="h5" mb={2}>
        Screens
      </Typography>

      {isLoading && <CircularProgress />}
      <List>
        {screens?.map((screen) => (
          <ListItem
            key={screen.id}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => deleteMutation.mutate(screen.id)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={screen.name}
              secondary={screen.layout
                .map((row) => `${row.row}×${row.seatCount} (${row.seatType})`)
                .join(", ")}
            />
          </ListItem>
        ))}
      </List>

      <Typography variant="h6" mt={4} mb={2}>
        Add a screen
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit((input) => createMutation.mutate(input))}
        display="grid"
        gap={2}
      >
        <TextField label="Screen name" {...register("name")} />
        {fields.map((field, index) => (
          <Stack direction="row" spacing={1} key={field.id} alignItems="center">
            <TextField
              label="Row"
              {...register(`layout.${index}.row` as const)}
              sx={{ width: 80 }}
            />
            <TextField
              label="Seat count"
              type="number"
              {...register(`layout.${index}.seatCount` as const, {
                valueAsNumber: true,
              })}
              sx={{ width: 120 }}
            />
            <TextField
              label="Seat type"
              select
              defaultValue="regular"
              {...register(`layout.${index}.seatType` as const)}
              sx={{ width: 140 }}
            >
              {SEAT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <IconButton
              onClick={() => remove(index)}
              disabled={fields.length === 1}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
        <Button
          onClick={() =>
            append({ row: "", seatCount: 10, seatType: "regular" })
          }
        >
          Add row
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={createMutation.isPending}
        >
          Create screen
        </Button>
      </Box>
    </Box>
  );
}
