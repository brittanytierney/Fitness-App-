import { setAuthToken } from "./http";

const KEY = "fitness_auth";

export type AuthUser = {
  _id?: string;
  username?: string;
};

export type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

export function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { token: null, user: null };

    const parsed = JSON.parse(raw) as Partial<AuthState>;

    if (parsed.token) setAuthToken(parsed.token);

    return {
      token: parsed.token ?? null,
      user: (parsed.user as AuthUser) ?? null,
    };
  } catch {
    return { token: null, user: null };
  }
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(KEY, JSON.stringify({ token, user }));
  setAuthToken(token);
}

export function clearAuth() {
  localStorage.removeItem(KEY);
  setAuthToken(null);
}
