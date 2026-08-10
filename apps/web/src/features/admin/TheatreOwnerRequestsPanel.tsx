import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import {
  listPendingTheatreOwnerRequests,
  reviewTheatreOwnerRequest,
} from "./adminApi.js";

export function TheatreOwnerRequestsPanel() {
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin", "theatre-owner-requests"],
    queryFn: listPendingTheatreOwnerRequests,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "approved" | "rejected";
    }) => reviewTheatreOwnerRequest(id, { decision }),
    onMutate: ({ id }) => setPendingId(id),
    onSettled: () => {
      setPendingId(null);
      queryClient.invalidateQueries({
        queryKey: ["admin", "theatre-owner-requests"],
      });
    },
  });

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Pending theatre-owner requests
      </Typography>
      {requests?.length === 0 && (
        <Typography color="text.secondary">Nothing pending.</Typography>
      )}
      <List>
        {requests?.map((request) => (
          <ListItem key={request.id} divider>
            <ListItemText
              primary={`${request.theatreName} — ${request.city}`}
              secondary={request.reason ?? "No reason provided"}
            />
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={reviewMutation.isPending && pendingId === request.id}
                onClick={() =>
                  reviewMutation.mutate({
                    id: request.id,
                    decision: "approved",
                  })
                }
              >
                Approve
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={reviewMutation.isPending && pendingId === request.id}
                onClick={() =>
                  reviewMutation.mutate({
                    id: request.id,
                    decision: "rejected",
                  })
                }
              >
                Reject
              </Button>
            </Stack>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
