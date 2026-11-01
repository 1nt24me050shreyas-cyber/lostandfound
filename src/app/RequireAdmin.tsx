import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function RequireAdmin() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  return user?.role === "admin" ? <Outlet /> : <Navigate to="/account" replace />;
}
