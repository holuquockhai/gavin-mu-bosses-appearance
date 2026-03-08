import { createSlice } from "@reduxjs/toolkit";

export const channelSlice = createSlice({
    name: "channels",
    initialState: {
        value: [
            {
                id: 1,
                name: "Channel 1",
            },
            {
                id: 2,
                name: "Channel 2",
            },
            {
                id: 3,
                name: "Channel 3"
            }

        ]
    },
    reducers: {
        createChannel: (state, action) => {
            state.value = [...state, {
                name: action.payload,
            }]
        },
        deleteChannel : (state, action) => {
            const name = action.payload;
            state.value = state.value.filter(t => t.name !== name);
        }
    }
});

export const {createChannel, deleteChannel} = channelSlice.actions;