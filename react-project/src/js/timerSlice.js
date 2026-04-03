import { createSlice } from "@reduxjs/toolkit";

const hoursList = Array.from({ length: 25 }, (_, index) => ({
        id: index.toString(),
        value: index.toString(),
        label: String(index).padStart(2, "0")
    }));

const minuteList = Array.from({ length: 61 }, (_, index) => ({
    id: index.toString(),
    value: index.toString(),
    label: String(index).padStart(2, "0")
}));

export const timerHourSlice = createSlice({
    name: "timerHours",
    initialState: {
        value: hoursList
    },
    reducer: {
    }
});

export const timerminuteSlice = createSlice({
    name: "timerMinutes",
    initialState: {
        value: minuteList
    },
    reducer: {
    }
});