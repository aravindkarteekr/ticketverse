import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "../components/HomePage.js";

/** Feature routes (auth, movies, theatres, booking, payment, admin) are added as each feature is built. */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
]);
