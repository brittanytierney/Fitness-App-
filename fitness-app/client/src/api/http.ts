import axios from "axios";

// Base URL:
// - Vercel (production): uses VITE_API_URL
// - Local development: falls back to localhost
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export const http = axios.create({
  baseURL,
  withCredentials: true, // keep if you use cookies / auth
});

/**
 * Attach or remove the Authorization header
 */
export function setAuthToken(token: string | null) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}
