import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { configureStore} from "@reduxjs/toolkit"
import { Provider } from "react-redux"
// import './index.css'
import App from './App.jsx'
import { bossesSlice } from './js/bossSlice.js'
import { channelSlice } from './js/channelSlice.js'


const store = configureStore({
  reducer : {
     bosses: bossesSlice.reducer,
     channels: channelSlice.reducer,
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App /> 
    </Provider>
  </StrictMode>,
)
