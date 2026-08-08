import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@ticketverse/schemas";

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
}

const initialState: AuthState = { user: null, status: "idle" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authLoading(state) {
      state.status = "loading";
    },
    authResolved(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "unauthenticated";
    },
    loggedOut(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
});

export const { authLoading, authResolved, loggedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
