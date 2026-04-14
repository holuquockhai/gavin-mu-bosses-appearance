// Layout.jsx
import { Link, Outlet } from "react-router-dom";
import TopNavigation from "./TopNavigation";
import LeftContent from "./LeftContent";
import RightContent from "./RightContent";
import BottomContent from "./BottomContent";
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
          <div className="row wrap">
            <div className="col-12 text-center">
              <h1 className="pt-4 pb-4 mb-0 page-title">MU BOSS TIMER</h1>
            </div>
          </div>

          <section className="row main-row">
            <div className="col-3">
              <LeftContent />
            </div>

            <div className="col-6">
              <Outlet />
            </div>

            <div className="col-3">
              <RightContent />
            </div>
          </section>

          <BottomContent />
        </div>
      </main>
    </>
  );
}
