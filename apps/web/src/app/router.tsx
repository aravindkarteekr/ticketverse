import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../components/RootLayout.js";
import { ProtectedRoute } from "../components/ProtectedRoute.js";
import { HomePage } from "../components/HomePage.js";
import { LoginPage } from "../features/auth/LoginPage.js";
import { SignupPage } from "../features/auth/SignupPage.js";
import { MoviesListPage } from "../features/movies/MoviesListPage.js";
import { MovieDetailPage } from "../features/movies/MovieDetailPage.js";
import { RequestTheatreOwnerPage } from "../features/theatres/RequestTheatreOwnerPage.js";
import { MyTheatresPage } from "../features/theatres/MyTheatresPage.js";
import { TheatreScreensPage } from "../features/theatres/TheatreScreensPage.js";
import { SeatMapPage } from "../features/booking/SeatMapPage.js";
import { MyBookingsPage } from "../features/booking/MyBookingsPage.js";

/** Feature routes (payment, admin) are added as each feature is built. */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "movies", element: <MoviesListPage /> },
      { path: "movies/:id", element: <MovieDetailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "theatres/request", element: <RequestTheatreOwnerPage /> },
          { path: "shows/:id", element: <SeatMapPage /> },
          { path: "bookings/mine", element: <MyBookingsPage /> },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={["theatre_owner"]} />,
        children: [
          { path: "theatres/mine", element: <MyTheatresPage /> },
          { path: "theatres/:theatreId/screens", element: <TheatreScreensPage /> },
        ],
      },
    ],
  },
]);
