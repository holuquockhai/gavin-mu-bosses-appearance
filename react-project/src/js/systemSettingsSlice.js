import { createSlice } from "@reduxjs/toolkit";

export const systemSettingsSlice = createSlice({
  name: "systemSettings",
  initialState: {
    soundEnabled: localStorage.getItem("soundEnabled") === "true",
    soundStyle: localStorage.getItem("soundStyle") || "chime",
  },
  reducers: {
    setSoundEnabled: (state, action) => {
      state.soundEnabled = action.payload;
      localStorage.setItem("soundEnabled", String(action.payload));
    },
    setSoundStyle: (state, action) => {
      state.soundStyle = action.payload;
      localStorage.setItem("soundStyle", action.payload);
    },
  },
});

export const { setSoundEnabled, setSoundStyle } = systemSettingsSlice.actions;
