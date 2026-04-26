import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import "./api/http.js";
// import './index.css'
import App from "./App.jsx";
import { bossesSlice } from "./js/bossSlice.js";
import { channelSlice } from "./js/channelSlice.js";
import { bossCountdownSlice, timerHourSlice, timerminuteSlice } from "./js/timerSlice.js";
import { presetSettingSlice } from "./js/presetSlice.js";
import { notificationSlice } from "./js/notificationSlice.js";
import { systemSettingsSlice } from "./js/systemSettingsSlice.js";
import { RouterProvider } from "react-router-dom";
import router from "./router.jsx";

const store = configureStore({
  reducer: {
    bosses: bossesSlice.reducer,
    channels: channelSlice.reducer,
    timerHours: timerHourSlice.reducer,
    timerMinutes: timerminuteSlice.reducer,
    bossCountdowns: bossCountdownSlice.reducer,
    presetSettings: presetSettingSlice.reducer,
    notifications: notificationSlice.reducer,
    systemSettings: systemSettingsSlice.reducer,
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      {/* <RouterProvider router={router} /> */}
    </Provider>
  </StrictMode>,
);
