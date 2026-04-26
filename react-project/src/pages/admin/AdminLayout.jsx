// Layout.jsx
import { Link, Outlet } from "react-router-dom";
import TopNavigation from "../components/TopNavigation";
import LeftContent from "../components/LeftContent";
import RightContent from "../components/RightContent";
import BottomContent from "../components/BottomContent";
import { getUser } from "../../utils/auth";
import { useState, useEffect } from "react";
import logo from "../../assets/logo.png";

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
              <h1 className="pt-4 pb-4 mb-0 page-title d-inline-flex align-items-center justify-content-center gap-3">
                <Link to="/" className="page-title-logo-link" aria-label="Go to landing page">
                  <img src={logo} alt="MU logo" className="page-title-logo" />
                </Link>
                <span>MU BOSS TIMER</span>
              </h1>
            </div>
          </div>

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
