export const saveAuth = (data) => {
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("token_type", data.token_type || "bearer");

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  } else {
    localStorage.removeItem("user");
  }
};

export const getToken = () => localStorage.getItem("access_token");

export const getUser = () => {
  const raw = localStorage.getItem("user");

  if (!raw || raw === "undefined" || raw === "null") {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Invalid user JSON:", raw);
    localStorage.removeItem("user");
    return null;
  }
};

export const isAuthenticated = () => !!getToken();

export const isAdmin = () => {
  const user = getUser();

  // support roles array
  return user?.roles?.includes("admin");
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("user");
};
