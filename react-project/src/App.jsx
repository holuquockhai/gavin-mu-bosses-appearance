import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    const theme = isDark ? "dark" : "light";

    // Bootstrap 5.3 theme switch
    document.documentElement.setAttribute("data-bs-theme", theme);

    // Persist
    localStorage.setItem("theme", theme);
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Landing isDark={isDark} setIsDark={setIsDark} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
