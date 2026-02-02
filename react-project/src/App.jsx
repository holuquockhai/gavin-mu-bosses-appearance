import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import TopNavigation from './components/TopNavigation'
import LeftNavigation from './components/LeftNavigation'
import MainContent from './components/MainContent'
import RightNavigation from './components/RightNavigation'
// import './App.css'

const listBosses = [
  "Kundun",
  "Medusa",
  "Nightmare",
  "Selupan",
  "Silvester",
  "Core",
  "Ferea",
  "Nyx",
  "GOD"
];

const bosses = listBosses.map((boss, id)=>({
  id: id,
  title : boss
}));

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='container-fluid vh-100 bg-black text-light ' data-bs-theme="dark">

        <div className='row wrap'>
          <div className='col-12 text-center'>
              <h1 className='p-3'>MU BOSS TIMER</h1>
          </div>
          
        </div>

        {/* === TOP NAVIGATION === */}
        <TopNavigation />
        {/* === #TOP NAVIGATION === */}

        {/*<!-- ===== Main row ===== -->*/}
        <section className="row main-row">
          {/* <!-- LEFT --> */}
          <div className='col-3'><LeftNavigation/></div>
          
          <div className='col-6'><MainContent bosses = {bosses}/></div>

          <div className='col-3'><RightNavigation/></div>

          
        </section>
        
      </div>
     
    </>
  )
}

export default App
