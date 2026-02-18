import { useState } from "react";
import { apiLogin, apiSignup } from "../api/authApi";
import { saveAuth } from "../api/authStore";
import axios from "axios";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");

    try {
      const fn = mode === "signup" ? apiSignup : apiLogin;
      const data = await fn(username, password);
      saveAuth(data.token, data.user);
      window.location.href = "/";
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error || "Auth failed",
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Auth failed");
      }
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h2>{mode === "signup" ? "Create account" : "Log in"}</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Username (letters/numbers/_)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          placeholder="Password (min 8)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />

        <button type="submit">
          {mode === "signup" ? "Sign up" : "Log in"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <button
        type="button"
        style={{ marginTop: 12 }}
        onClick={() => setMode(mode === "signup" ? "login" : "signup")}
      >
        {mode === "signup" ? "Already have an account?" : "Need an account?"}
      </button>
    </div>
  );
}
