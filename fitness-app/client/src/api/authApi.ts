import { api } from "./http";

export async function apiSignup(username: string, password: string) {
  const res = await api.post("/api/auth/signup", { username, password });
  return res.data;
}

export async function apiLogin(username: string, password: string) {
  const res = await api.post("/api/auth/login", { username, password });
  return res.data;
}
