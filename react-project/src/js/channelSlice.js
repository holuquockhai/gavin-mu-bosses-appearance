import { createSlice } from "@reduxjs/toolkit";

export const channelSlice = createSlice({
    name: "channels",
    initialState: {
        value: []
    },
    reducers: {
        setChannels: (state, action) => {
            state.value = action.payload || [];
        },
        createChannel: (state, action) => {
            state.value = [...state.value, action.payload];
        },
        updateChannel: (state, action) => {
            state.value = state.value.map((channel) =>
                channel.id === action.payload.id ? action.payload : channel
            );
        },
        deleteChannel : (state, action) => {
            const channelId = action.payload;
            state.value = state.value.filter((channel) => channel.id !== channelId);
        }
    }
});

export const {setChannels, createChannel, updateChannel, deleteChannel} = channelSlice.actions;
