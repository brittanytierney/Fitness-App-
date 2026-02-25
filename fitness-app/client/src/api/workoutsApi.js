
import axios from "axios";

const API_BASE = "http://localhost:5050/api";
const AUTH_KEY = "fitness_auth";

function getToken() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}


export async function apiGetWorkoutDay(date) {
  const res = await axios.get(`${API_BASE}/workouts/day`, {
    params: { date },
    headers: getAuthHeaders(),
  });
  return res.data;
}


export async function apiUpsertWorkoutDay(date, payload) {
  const res = await axios.put(`${API_BASE}/workouts/day/${date}`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
}


export async function apiListRecentWorkoutDays(limit = 30) {
  const res = await axios.get(`${API_BASE}/workouts/recent`, {
    params: { limit },
    headers: getAuthHeaders(),
  });
  return res.data;
}


export async function apiListWorkoutDaysInRange(from, to) {
  const res = await axios.get(`${API_BASE}/workouts/range`, {
    params: { from, to },
    headers: getAuthHeaders(),
  });
  return res.data;
}


export async function apiGetPRs(requireCompleted = false) {
  const res = await axios.get(`${API_BASE}/progress/prs`, {
    params: { requireCompleted: requireCompleted ? 1 : 0 },
    headers: getAuthHeaders(),
  });
  return res.data;
}


export async function apiGetWeeklyVolume(from, to, requireCompleted = false) {
  const res = await axios.get(`${API_BASE}/progress/volume`, {
    params: { from, to, requireCompleted: requireCompleted ? 1 : 0 },
    headers: getAuthHeaders(),
  });
  return res.data;
}


export async function apiGetRecentWorkouts(limit = 120) {
  return apiListRecentWorkoutDays(limit);
}
