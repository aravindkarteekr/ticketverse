import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { AuthUser } from "@ticketverse/schemas";
import { authReducer } from "../app/authSlice.js";
import { ProtectedRoute } from "./ProtectedRoute.js";

type AuthState = ReturnType<typeof authReducer>;

function renderProtected(
  authState: AuthState,
  allowedRoles?: AuthUser["role"][],
) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authState },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/" element={<div>Home page</div>} />
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/protected" element={<div>Secret content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

const adminUser: AuthUser = {
  id: "1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
};
const regularUser: AuthUser = {
  id: "2",
  name: "Regular",
  email: "regular@example.com",
  role: "user",
};

describe("ProtectedRoute", () => {
  it("renders nothing while auth status is still loading", () => {
    renderProtected({ user: null, status: "loading" });

    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("redirects to /login when there is no authenticated user", () => {
    renderProtected({ user: null, status: "unauthenticated" });

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects to / when the user's role is not in allowedRoles", () => {
    renderProtected({ user: regularUser, status: "authenticated" }, ["admin"]);

    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("renders the outlet when the user is authenticated with an allowed role", () => {
    renderProtected({ user: adminUser, status: "authenticated" }, ["admin"]);

    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("renders the outlet for any authenticated user when no allowedRoles are specified", () => {
    renderProtected({ user: regularUser, status: "authenticated" });

    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });
});
