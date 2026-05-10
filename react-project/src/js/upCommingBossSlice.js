import { createSlice } from "@reduxjs/toolkit";

export const upCommingBossesSlice = createSlice({
    name: "upCommingBosses",
    initialState: {
        value: [
            {
                id: 1,
                bossName: "kundun",
                channel: "4",
                hours: 1,
                minutes: 5,
            },
        ]
    },
    reducers: {
        updateBossAppearance: () => {}
    }

});
