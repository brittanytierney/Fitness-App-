import axios from "axios";

const API_BASE = "http://localhost:5050/api";
const AUTH_KEY = "fitness_auth";

function getToken(): string | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------- USER ----------
export async function apiListMyMealPlans() {
  const res = await axios.get(`${API_BASE}/meal-plans`, {
    headers: getAuthHeaders(),
  });
  return res.data as { mealPlans: any[] };
}

export async function apiGetMyMealPlan(id: string) {
  const res = await axios.get(`${API_BASE}/meal-plans/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data as { mealPlan: any };
}

// ---------- ADMIN ----------
export async function apiAdminSearchUsers(query: string, limit = 20) {
  const res = await axios.get(`${API_BASE}/admin/users`, {
    params: { query, limit },
    headers: getAuthHeaders(),
  });
  return res.data as { users: any[] };
}

export async function apiAdminListUserMealPlans(userId: string) {
  const res = await axios.get(`${API_BASE}/admin/users/${userId}/meal-plans`, {
    headers: getAuthHeaders(),
  });
  return res.data as { mealPlans: any[] };
}

export async function apiAdminGetUserMealPlan(userId: string, id: string) {
  const res = await axios.get(
    `${API_BASE}/admin/users/${userId}/meal-plans/${id}`,
    { headers: getAuthHeaders() },
  );
  return res.data as { mealPlan: any };
}

export async function apiAdminCreateMealPlan(userId: string, payload: any) {
  const res = await axios.post(
    `${API_BASE}/admin/users/${userId}/meal-plans`,
    payload,
    { headers: getAuthHeaders() },
  );
  return res.data as { mealPlan: any };
}

export async function apiAdminUpdateMealPlan(
  userId: string,
  id: string,
  payload: any,
) {
  const res = await axios.put(
    `${API_BASE}/admin/users/${userId}/meal-plans/${id}`,
    payload,
    { headers: getAuthHeaders() },
  );
  return res.data as { mealPlan: any };
}

export async function apiAdminDeleteMealPlan(userId: string, id: string) {
  const res = await axios.delete(
    `${API_BASE}/admin/users/${userId}/meal-plans/${id}`,
    {
      headers: getAuthHeaders(),
    },
  );
  return res.data as { ok: true };
}
