import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import TopNavigation from './components/TopNavigation'
import LeftNavigation from './components/LeftNavigation'
import RightNavigation from './components/RightNavigation'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='wrap'>
        <h1>MU BOSS TIMER</h1>
      </div>

      {/* === TOP NAVIGATION === */}
      <TopNavigation/>
      {/* === #TOP NAVIGATION === */}

      {/*<!-- ===== Main row ===== -->*/}
      <section className="main-row">
        {/* <!-- LEFT --> */}
        <LeftNavigation/>

      {/*<!-- MIDDLE -->*/}
      <div className="mid">
        <div className="card unified" id="showHideCard">
          <div className="row">
            <h2>Show / Hide Boss Cards</h2>
            <span className="small">Use to temporarily hide cards</span>
          </div>

          <div className="chips" id="visChips"></div>

          <div className="row">
            <span className="small">Presets (max 3):</span>
            <select id="presetSelect" className="select" ></select>
            <button className="btn" id="applyPresetBtn">Apply</button>
            <button className="btn" id="savePresetBtn">Save</button>
            <button className="btn" id="newPresetBtn">New</button>
            <button className="btn" id="renamePresetBtn">Rename</button>
            <button className="btn" id="deletePresetBtn">Delete</button>
          </div>
        </div>

        <div className="channel-row unified">
          <select className="select" id="channelSelect" title="Channel"></select>
        </div>

        <div id="cards" className="unified"></div>

      </div>

      {/*<!-- RIGHT -->*/}
      <RightNavigation/>

        
      </section>
    </>
  )
}

export default App
