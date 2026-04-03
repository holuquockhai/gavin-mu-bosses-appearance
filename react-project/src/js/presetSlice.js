import { createSlice } from "@reduxjs/toolkit";

export const presetSettingSlice = createSlice({
    name: "presetSettings",

    // Innitial bosses list
    initialState: {
        value: [],
    },

    reducers: {
        createPreset: (state, action) =>{ 
            state.value = [...state.value, {
                id:5,
                name: action.payload,
                data: [],
            }]
        },
        
        //@todo: update preset name based on Perset ID
        renamePreset: (state, action) => {
            console.log(action.payload);
        },

        deletePreset: (state, action) => {
            const id = action.payload;
            state.value = state.value.filter(t => t.id !== id);
        },
    }
});

export const {createPreset, renamePreset,  deletePreset} = presetSettingSlice.actions;