import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "@ticketverse/schemas";
import { useAppSelector } from "../app/hooks.js";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, status } = useAppSelector((state) => state.auth);

  if (status === "idle" || status === "loading") return null;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
