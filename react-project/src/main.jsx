import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
// import './index.css'
import App from "./App.jsx";
import { bossesSlice } from "./js/bossSlice.js";
import { channelSlice } from "./js/channelSlice.js";
import { timerHourSlice, timerminuteSlice } from "./js/timerSlice.js";
import { presetSettingSlice } from "./js/presetSlice.js";

const store = configureStore({
  reducer: {
    bosses: bossesSlice.reducer,
    channels: channelSlice.reducer,
    timerHours: timerHourSlice.reducer,
    timerMinutes: timerminuteSlice.reducer,
    presetSettings: presetSettingSlice.reducer,
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
