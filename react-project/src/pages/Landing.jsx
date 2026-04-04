import { useState, useEffect } from "react";
import TopNavigation from "./components/TopNavigation";
import LeftContent from "./components/LeftContent";
import MainContent from "./components/MainContent";
import RightContent from "./components/RightContent";
import BottomContent from "./components/BottomContent";

const Landing = () => {
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
    <>
      <TopNavigation isDark={isDark} setIsDark={setIsDark} />

      <main>
        <div id="main-content" className="container-fluid min-vh-100">
          <div className="row wrap">
            <div className="col-12 text-center">
              <h1 className="pt-4 pb-4 mb-0 page-title">MU BOSS TIMER </h1>
            </div>
          </div>

          {/*<!-- ===== Main row ===== -->*/}
          <section className="row main-row">
            {/* <!-- LEFT --> */}
            <div className="col-3">
              <LeftContent />
            </div>

            <div className="col-6">
              <MainContent />
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
};

export default Landing;
