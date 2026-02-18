import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "./auth";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const loc = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
