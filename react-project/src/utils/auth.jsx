const AUTH_KEYS = ["access_token", "token_type", "user", "auth_expires_at"];
const DEFAULT_AUTH_MAX_AGE_SECONDS = 24 * 60 * 60;

const clearAuthStorage = (storage) => {
  AUTH_KEYS.forEach((key) => storage.removeItem(key));
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "="));

    return JSON.parse(decodedPayload);
  } catch {
    return {};
  }
};

const getAuthExpiresAt = (token) => {
  const payload = decodeJwtPayload(token);

  if (payload.exp) {
    return payload.exp * 1000;
  }

  return Date.now() + DEFAULT_AUTH_MAX_AGE_SECONDS * 1000;
};

const getAuthMaxAgeSeconds = (expiresAt) => (
  Math.max(1, Math.floor((Number(expiresAt) - Date.now()) / 1000))
);

const setAuthCookie = (key, value, maxAgeSeconds = DEFAULT_AUTH_MAX_AGE_SECONDS) => {
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
};

const getAuthCookie = (key) => {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${key}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(key.length + 1));
};

const clearAuthCookie = (key) => {
  document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

const clearAuthCookies = () => {
  AUTH_KEYS.forEach(clearAuthCookie);
};

const isAuthExpired = () => {
  const expiresAt = Number(getAuthCookie("auth_expires_at") || localStorage.getItem("auth_expires_at") || 0);

  return expiresAt > 0 && Date.now() >= expiresAt;
};

export const saveAuth = (data) => {
  clearAuthStorage(sessionStorage);
  const expiresAt = getAuthExpiresAt(data.access_token);
  const maxAgeSeconds = getAuthMaxAgeSeconds(expiresAt);
  const tokenType = data.token_type || "bearer";

  setAuthCookie("access_token", data.access_token, maxAgeSeconds);
  setAuthCookie("token_type", tokenType, maxAgeSeconds);
  setAuthCookie("auth_expires_at", String(expiresAt), maxAgeSeconds);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("token_type", tokenType);
  localStorage.setItem("auth_expires_at", String(expiresAt));

  if (data.user) {
    const userJson = JSON.stringify(data.user);
    setAuthCookie("user", userJson, maxAgeSeconds);
    localStorage.setItem("user", userJson);
  } else {
    clearAuthCookie("user");
    localStorage.removeItem("user");
  }
};

export const getToken = () => {
  if (isAuthExpired()) {
    logout();
    return null;
  }

  return getAuthCookie("access_token") || localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
};

export const getUser = () => {
  if (isAuthExpired()) {
    logout();
    return null;
  }

  const raw = getAuthCookie("user") || localStorage.getItem("user") || sessionStorage.getItem("user");

  if (!raw || raw === "undefined" || raw === "null") {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    console.error("Invalid user JSON:", raw);
    clearAuthCookie("user");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    return null;
  }
};

export const updateStoredUser = (user) => {
  const userJson = JSON.stringify(user);
  const expiresAt = Number(getAuthCookie("auth_expires_at") || localStorage.getItem("auth_expires_at") || 0);
  const maxAgeSeconds = expiresAt > 0 ? getAuthMaxAgeSeconds(expiresAt) : DEFAULT_AUTH_MAX_AGE_SECONDS;

  setAuthCookie("user", userJson, maxAgeSeconds);
  localStorage.setItem("user", userJson);
  window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: user }));
};

export const isAuthenticated = () => !!getToken();

export const isAdmin = () => {
  const user = getUser();

  // support roles array
  return user?.roles?.includes("admin");
};

export const logout = () => {
  clearAuthCookies();
  clearAuthStorage(sessionStorage);
  clearAuthStorage(localStorage);
};
