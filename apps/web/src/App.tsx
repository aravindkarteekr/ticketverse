import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { store } from "./app/store.js";
import { queryClient } from "./app/queryClient.js";
import { theme } from "./theme/theme.js";
import { router } from "./app/router.js";
import { useBootstrapAuth } from "./app/useBootstrapAuth.js";

function AuthBootstrap() {
  useBootstrapAuth();
  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthBootstrap />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
