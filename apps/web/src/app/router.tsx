import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../components/RootLayout.js";
import { HomePage } from "../components/HomePage.js";
import { LoginPage } from "../features/auth/LoginPage.js";
import { SignupPage } from "../features/auth/SignupPage.js";

/** Feature routes (movies, theatres, booking, payment, admin) are added as each feature is built. */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
    ],
  },
]);
