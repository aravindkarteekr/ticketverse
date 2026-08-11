import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { getErrorMessage } from "../lib/errors.js";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  sx?: object;
}

/** Standard inline error banner for a failed query/mutation, with an optional retry action. */
export function ErrorState({ error, onRetry, sx }: ErrorStateProps): ReactNode {
  return (
    <Alert
      severity="error"
      sx={{ my: 2, ...sx }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {getErrorMessage(error)}
    </Alert>
  );
}
