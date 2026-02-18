import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { apiLogin } from "../api/authApi";
import { setAuth } from "./auth";

export default function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiLogin(username.trim(), password);
      setAuth({ token: data.token, user: data.user });
      nav("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h1>Login</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Login"}
        </button>

        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>

      <p style={{ marginTop: 12 }}>
        Need an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}
