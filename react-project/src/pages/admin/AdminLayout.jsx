// Layout.jsx
import { Outlet } from "react-router-dom";
import TopNavigation from "../components/TopNavigation";
import BottomContent from "../components/BottomContent";
import { getUser } from "../../utils/auth";
import { useState, useEffect } from "react";

export default function Layout() {
  const user = getUser();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [isDark]);
  return (
    <>
      <TopNavigation isDark={isDark} setIsDark={setIsDark} user={user} />

      <main>
        <div id="main-content" className="container-fluid min-vh-100">
          <section className="row main-row g-3 align-items-start">
            <div className="col-12">
              <Outlet />
            </div>
          </section>

          <BottomContent />
        </div>
      </main>
    </>
  );
}
