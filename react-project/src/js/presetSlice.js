import { createSlice } from "@reduxjs/toolkit";

export const presetSettingSlice = createSlice({
    name: "presetSettings",

    // Innitial bosses list
    initialState: {
        value: [],
    },

    reducers: {
        setPresetSettings: (state, action) => {
            state.value = action.payload;
        },

        createPreset: (state, action) =>{ 
            if (state.value.length >= 3) {
                return;
            }

            state.value = [...state.value, {
                id: action.payload.id,
                name: action.payload.name,
                channels: action.payload.channels || {},
            }]
        },

        updatePreset: (state, action) => {
            const preset = state.value.find((setting) => setting.id === Number(action.payload.id));

            if (preset) {
                preset.name = action.payload.name;
                preset.channels = action.payload.channels || {};
            }
        },

        savePresetChannel: (state, action) => {
            const { presetId, channel, bossIds } = action.payload;
            const preset = state.value.find((setting) => setting.id === Number(presetId));

            if (preset) {
                preset.channels = {
                    ...(preset.channels || {}),
                    [channel]: bossIds,
                };
            }
        },
        
        renamePreset: (state, action) => {
            const { presetId, name } = action.payload;
            const preset = state.value.find((setting) => setting.id === Number(presetId));

            if (preset) {
                preset.name = name;
            }
        },

        deletePreset: (state, action) => {
            const id = action.payload;
            state.value = state.value.filter(t => t.id !== id);
        },
    }
});

export const {
    createPreset,
    updatePreset,
    setPresetSettings,
    savePresetChannel,
    renamePreset,
    deletePreset,
} = presetSettingSlice.actions;
