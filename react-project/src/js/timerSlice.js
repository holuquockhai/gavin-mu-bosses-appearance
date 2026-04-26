import { createSlice } from "@reduxjs/toolkit";

const hoursList = Array.from({ length: 25 }, (_, index) => ({
        id: index.toString(),
        value: index.toString(),
        label: String(index).padStart(2, "0")
    }));

const minuteList = Array.from({ length: 60 }, (_, index) => ({
    id: index.toString(),
    value: index.toString(),
    label: String(index).padStart(2, "0")
}));

const parseDatabaseDate = (value) => {
    if (!value) {
        return Date.now();
    }

    const valueString = String(value);
    const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(valueString);

    return new Date(hasTimezone ? valueString : `${valueString}Z`).getTime();
};

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

export const bossCountdownSlice = createSlice({
    name: "bossCountdowns",
    initialState: {
        value: [],
        history: []
    },
    reducers: {
        setBossTimerState: (state, action) => {
            state.value = action.payload.timers.map((timer) => ({
                id: `${timer.channel}-${timer.boss_id}`,
                dbId: timer.id,
                bossId: timer.boss_id,
                bossName: timer.boss_name,
                channel: timer.channel,
                hours: timer.hours,
                minutes: timer.minutes,
                endAt: parseDatabaseDate(timer.end_at),
            }));
            state.history = action.payload.history.map((history) => ({
                id: `history-${history.id}`,
                dbId: history.id,
                bossId: history.boss_id,
                bossName: history.boss_name,
                channel: history.channel,
                completedAt: parseDatabaseDate(history.completed_at),
            }));
        },
        setBossCountdown: (state, action) => {
            const { bossId, bossName, channel, hours, minutes, endAt } = action.payload;
            const totalSeconds = Number(hours) * 3600 + Number(minutes) * 60;
            const timerKey = `${channel}-${bossId}`;

            if (!bossId || !channel || totalSeconds <= 0) {
                return;
            }

            const existingTimer = state.value.find((timer) => timer.id === timerKey);
            const timer = {
                id: timerKey,
                bossId,
                bossName,
                channel,
                hours: Number(hours),
                minutes: Number(minutes),
                endAt: endAt || Date.now() + totalSeconds * 1000,
            };

            if (existingTimer) {
                Object.assign(existingTimer, timer);
            } else {
                state.value.push(timer);
            }
        },
        clearBossCountdown: (state, action) => {
            const { bossId, channel } = action.payload;
            state.value = state.value.filter((timer) => timer.bossId !== bossId || timer.channel !== channel);
        },
        markBossAppeared: (state, action) => {
            const { bossId, channel, completedAt } = action.payload;
            const timer = state.value.find((item) => item.bossId === bossId && item.channel === channel);

            if (!timer) {
                return;
            }

            state.value = state.value.filter((item) => item.id !== timer.id);
            state.history = [
                {
                    ...timer,
                    completedAt: completedAt || Date.now(),
                },
                ...state.history,
            ].slice(0, 5);
        },
        completeExpiredCountdowns: (state, action) => {
            const completedAt = action.payload || Date.now();
            const expiredTimers = state.value.filter((timer) => timer.endAt <= completedAt);

            if (expiredTimers.length === 0) {
                return;
            }

            const historyItems = expiredTimers.map((timer) => ({
                ...timer,
                completedAt,
            }));

            state.value = state.value.filter((timer) => timer.endAt > completedAt);
            state.history = [...historyItems, ...state.history].slice(0, 5);
        },
    }
});

export const {
    setBossTimerState,
    setBossCountdown,
    clearBossCountdown,
    markBossAppeared,
    completeExpiredCountdowns,
} = bossCountdownSlice.actions;
