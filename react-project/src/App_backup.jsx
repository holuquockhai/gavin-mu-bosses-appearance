import { useState, useEffect } from 'react'
import TopNavigation from './pages/components/TopNavigation'
import LeftContent from './pages/components/LeftContent'
import MainContent from './pages/components/MainContent'
import RightContent from './pages/components/RightContent'
import BottomContent from './pages/components/BottomContent'
// import './App.css'

const listChannels = [
  {value: 1, title: "Channel 1"},
  {value: 2, title: "Channel 2"},
  {value: 3, title: "Channel 3"},
  {value: 4, title: "Channel 4"},
  {value: 5, title: "Channel 5"},
  {value: 6, title: "Channel 6"},
  {value: 7, title: "Channel 7"},
  {value: 8, title: "Channel 8"},
  {value: 9, title: "Channel 9"},
  {value: 10, title: "Channel 10"},
  {value: 11, title: "Channel 11"},
]


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
    <>
      <TopNavigation isDark={isDark} setIsDark={setIsDark} />
      
      <main>
          <div id='main-content' className='container-fluid min-vh-100' >
          <div className='row wrap'>
            <div className='col-12 text-center'>
              <h1 className='pt-4 pb-4 mb-0 page-title'>MU BOSS TIMER </h1>
            </div>
          </div>
         
          {/*<!-- ===== Main row ===== -->*/}
          <section className="row main-row">
            
            {/* <!-- LEFT --> */}
            <div className='col-3'><LeftContent/></div>
            
            <div className='col-6'><MainContent /></div>

            <div className='col-3'><RightContent/></div>

          </section>
          
          <BottomContent/>
          
        </div>
      </main>
    </>
  )
}

export default App
