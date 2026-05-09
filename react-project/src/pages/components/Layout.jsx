// Layout.jsx
import { Outlet } from "react-router-dom";
import TopNavigation from "./TopNavigation";
import LeftContent from "./LeftContent";
import RightContent from "./RightContent";
import BottomContent from "./BottomContent";
import { getUser } from "../../utils/auth";
import { useState, useEffect } from "react";
import { useRealtimeSync } from "../../hooks/useRealtimeSync";

export default function Layout() {
  useRealtimeSync();

  const [user, setUser] = useState(() => getUser());
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [isDark]);

  useEffect(() => {
    const handleUserUpdated = (event) => setUser(event.detail || getUser());

    window.addEventListener("auth:user-updated", handleUserUpdated);
    return () => window.removeEventListener("auth:user-updated", handleUserUpdated);
  }, []);
  return (
    <>
      <TopNavigation isDark={isDark} setIsDark={setIsDark} user={user} />

      <main>
        <div id="main-content" className="container-fluid min-vh-100">
          <section className="row main-row g-3 align-items-start">
            <div className="col-12 col-xl-3 order-2 order-xl-1">
              <LeftContent />
            </div>

            <div className="col-12 col-xl-6 order-1 order-xl-2">
              <Outlet />
            </div>

            <div className="col-12 col-xl-3 order-3">
              <RightContent />
            </div>
          </section>

          <BottomContent />
        </div>
      </main>
    </>
  );
}
