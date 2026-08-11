import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

/** Standard "nothing here yet" placeholder used in place of a bare empty list. */
export function EmptyState({ message, action }: EmptyStateProps): ReactNode {
  return (
    <Box textAlign="center" py={6} color="text.secondary">
      <Typography>{message}</Typography>
      {action && <Box mt={2}>{action}</Box>}
    </Box>
  );
}
