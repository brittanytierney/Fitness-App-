
const KEY = "fitness_auth";

export type AuthState = {
  token: string;
  user: unknown;
} | null;

export function setAuth(_auth: AuthState) {
  // existing logic
}

export function getAuth() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken() {
  return getAuth()?.token || null;
}

export function getUser() {
  return getAuth()?.user || null;
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem(KEY);
}
