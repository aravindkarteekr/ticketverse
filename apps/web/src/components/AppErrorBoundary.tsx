import { Component, type ErrorInfo, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches render errors outside the router tree (e.g. provider setup) that the router's errorElement can't reach. */
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("Unhandled application error:", error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" mt={10} px={2}>
          <Typography variant="h4" mb={1}>
            Something went wrong
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Please reload the page. If the problem persists, try again later.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
