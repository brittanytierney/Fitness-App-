// client/src/api/http.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5050",
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("fitness_auth");
  const auth = raw ? JSON.parse(raw) : null;
  const token = auth?.token;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
