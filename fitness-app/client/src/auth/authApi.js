// client/src/api/authApi.js
import axios from "axios";

const BASE = "http://localhost:5050";

export async function apiLogin(username, password) {
  const res = await axios.post(`${BASE}/api/auth/login`, {
    username,
    password,
  });
  return res.data; // { token, user }
}

export async function apiSignup(username, password) {
  const res = await axios.post(`${BASE}/api/auth/signup`, {
    username,
    password,
  });
  return res.data; // { token, user }
}
