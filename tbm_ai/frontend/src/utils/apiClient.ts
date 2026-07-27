export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const TOKEN_KEY = "tbm_auth_token";
const USER_KEY = "tbm_auth_user";

export const apiFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const token = window.localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const refreshedToken = response.headers.get("X-Auth-Token");
  if (refreshedToken) {
    window.localStorage.setItem(TOKEN_KEY, refreshedToken);
  }

  if (response.status === 401 && window.location.pathname !== "/login") {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.location.href = "/login";
  }

  return response;
};
