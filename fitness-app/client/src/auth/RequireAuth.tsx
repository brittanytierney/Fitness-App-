import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "./auth";
import React from "react";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
})
 {
  const loc = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
