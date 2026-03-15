import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authService } from "@/services/AuthService";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute() {
  const location = useLocation();
  const { loading } = useAuth();
  const token = authService.getToken();

  if (loading) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

