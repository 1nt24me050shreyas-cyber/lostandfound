import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading" role="status">
        <LoaderCircle className="ui-spinner" size={22} />
        <span>Checking your account…</span>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/sign-in" replace state={{ from: location }} />;
}
