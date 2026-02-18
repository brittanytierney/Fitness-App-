import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import DashboardPage from "./features/dashboard/DashboardPage";
import WorkoutDayPage from "./features/workouts/WorkoutDayPage";
import LoginPage from "./auth/LoginPage";
import SignupPage from "./auth/SignupPage";
import RequireAuth from "./auth/RequireAuth";
import { getUser, isLoggedIn, logout } from "./auth/auth";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  border: "1px solid #ddd",
  background: isActive ? "#f2f2f2" : "transparent",
  color: "#111",
});

export default function App() {
  const nav = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getUser();

  function handleLogout() {
    logout();
    nav("/login");
  }

  return (
    <div>
      <header
        style={{
          maxWidth: 900,
          margin: "20px auto 0",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>🏋️ Fitness App</div>

          {loggedIn && (
            <nav style={{ display: "flex", gap: 8 }}>
              <NavLink to="/dashboard" style={linkStyle}>
                Dashboard
              </NavLink>
              <NavLink to="/workouts/day" style={linkStyle}>
                Workout Day
              </NavLink>
            </nav>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {loggedIn ? (
            <>
              <small style={{ color: "#555" }}>
                {user?.username ? `Signed in as ${user.username}` : "Signed in"}
              </small>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <nav style={{ display: "flex", gap: 8 }}>
              <NavLink to="/login" style={linkStyle}>
                Login
              </NavLink>
              <NavLink to="/signup" style={linkStyle}>
                Sign up
              </NavLink>
            </nav>
          )}
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/workouts/day"
            element={
              <RequireAuth>
                <WorkoutDayPage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
