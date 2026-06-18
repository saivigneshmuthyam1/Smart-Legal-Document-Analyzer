/**
 * Protected Route wrapper — redirects to /login if not authenticated.
 */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading authentication">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center animate-spin">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <p className="text-[13px] text-text-secondary">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
