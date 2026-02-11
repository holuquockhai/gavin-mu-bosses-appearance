import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import TopNavigation from './components/TopNavigation'
import LeftContent from './components/LeftContent'
import MainContent from './components/MainContent'
import RightContent from './components/RightContent'
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
  const [count, setCount] = useState(0);

  // // Initialize state based on the current body data attribute or default to light
  // const [isDarkMode, setIsDarkMode] = useState(
  //   document.documentElement.getAttribute('data-bs-theme') === 'dark'
  // );

  // useEffect(() => {
  //   // When isDarkMode changes, update the data-bs-theme attribute on the body
  //   document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
  //   // You could also save the preference to localStorage here for persistence
  // }, [isDarkMode]);

  // const toggleDarkMode = () => {
  //   setIsDarkMode(!isDarkMode);
  // };

  return (
    <>
      <TopNavigation/>
      
      <main>
          <div id='main-content' className='container-fluid' >
          <div className='row wrap'>
            <div className='col-12 text-center'>
              <h1 className='pt-4 pb-4 mb-0'>MU BOSS TIMER </h1>
            </div>
          </div>
         
          {/*<!-- ===== Main row ===== -->*/}
          <section className="row main-row">
            
            {/* <!-- LEFT --> */}
            <div className='col-3'><LeftContent/></div>
            
            <div className='col-6'><MainContent bosses = {bosses} channels = {listChannels}/></div>

            <div className='col-3'><RightContent/></div>

          </section>
          
        </div>
      </main>
     
     
    </>
  )
}

export default App
