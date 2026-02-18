// client/src/api/workoutsApi.js
import axios from "axios";

const BASE = "http://localhost:5050";
const AUTH_KEY = "fitness_auth";

function getToken() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return raw; // token-only fallback
  }
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGetWorkoutDay(date) {
  const res = await axios.get(`${BASE}/api/workouts/day`, {
    params: { date },
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function apiUpsertWorkoutDay(date, payload) {
  const res = await axios.put(`${BASE}/api/workouts/day/${date}`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function apiListRecentWorkoutDays(limit = 30) {
  const res = await axios.get(`${BASE}/api/workouts/recent`, {
    params: { limit },
    headers: getAuthHeaders(),
  });
  return res.data;
}
