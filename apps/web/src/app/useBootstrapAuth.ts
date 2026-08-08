import { useEffect } from "react";
import type { AuthUser } from "@ticketverse/schemas";
import { apiClient } from "../lib/axiosClient.js";
import { useAppDispatch } from "./hooks.js";
import { authLoading, authResolved } from "./authSlice.js";

/** Hydrates the auth slice from the httpOnly session cookie on app load. */
export function useBootstrapAuth() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      dispatch(authLoading());
      try {
        const { data } = await apiClient.get<AuthUser>("/me");
        if (!cancelled) dispatch(authResolved(data));
      } catch {
        if (!cancelled) dispatch(authResolved(null));
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
