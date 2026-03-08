import { createSlice } from "@reduxjs/toolkit";

export const presetSettingSlice = createSlice({
    name: "presetSettings",

    // Innitial bosses list
    initialState: {
        value: [
        {
            id: 1,
            name: "Setting 1",
        },
        {
            id: 2,
            name: "Setting 2",
        },
        {
            id: 3,
            name: "Setting 3",
        },
        {
            id: 4,
            name: "Setting 4",
        },
        ],
    },
    reducer: {
        createPreset: (state, action) => {
            state.value = [...state, {
                id: 5,
                name: action.payload,
            }]
        }
    }
});

export const {createPreset} = presetSettingSlice.actions;