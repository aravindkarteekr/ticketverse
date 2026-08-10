import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { authReducer } from "../../app/authSlice.js";
import { LoginPage } from "./LoginPage.js";
import { SignupPage } from "./SignupPage.js";

const { loginRequest, signupRequest } = vi.hoisted(() => ({
  loginRequest: vi.fn(),
  signupRequest: vi.fn(),
}));

vi.mock("./authApi.js", () => ({
  loginRequest,
  signupRequest,
  logoutRequest: vi.fn(),
}));

function renderWithProviders(ui: React.ReactElement) {
  const store = configureStore({ reducer: { auth: authReducer } });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("LoginPage validation", () => {
  it("shows validation errors and does not submit when fields are empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it("calls loginRequest with valid, normalized input", async () => {
    loginRequest.mockResolvedValue({
      id: "1",
      name: "A",
      email: "a@example.com",
      role: "user",
    });
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "A@Example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await vi.waitFor(() => expect(loginRequest).toHaveBeenCalled());
    expect(loginRequest.mock.calls[0]?.[0]).toEqual({
      email: "a@example.com",
      password: "secret123",
    });
  });
});

describe("SignupPage validation", () => {
  it("rejects a password shorter than 8 characters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />);

    await user.type(screen.getByLabelText(/name/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/at least 8 characters/i),
    ).toBeInTheDocument();
    expect(signupRequest).not.toHaveBeenCalled();
  });

  it("submits valid signup input", async () => {
    signupRequest.mockResolvedValue({
      id: "1",
      name: "Alice",
      email: "alice@example.com",
      role: "user",
    });
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />);

    await user.type(screen.getByLabelText(/name/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "goodpassword");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await vi.waitFor(() => expect(signupRequest).toHaveBeenCalled());
    expect(signupRequest.mock.calls[0]?.[0]).toEqual({
      name: "Alice",
      email: "alice@example.com",
      password: "goodpassword",
    });
  });
});
