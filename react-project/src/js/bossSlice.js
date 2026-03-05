import { createSlice } from '@reduxjs/toolkit';

export const bossesSlice = createSlice({
  name: 'bosses',

  // Innitial bosses list
  initialState: {
    value: [
      {
        id: 1,
        name: "Kundun",
        isShowed: false
      },
      {
        id: 2,
        name: "Medusa",
        isShowed:false,
      },
      {
        id: 3,
        name: "Nightmare",
        isShowed: false
      },
      {
        id: 4,
        name: "Selupan",
        isShowed: false
      },
    ],
  },

  reducers: {
    createBoss: (state, action) => {
      state.value = [...state.value, {
        name: 'Medusa',
        isShowed: false,
      }];
    },

    markBossAsShowed: (state, action) => {
      const id = action.payload;
      const boss = state.value.find(t => t.id === id);
      boss.isShowed = !boss.isShowed ;
    },

    deleteTodo: (state, action) => {
      const text = 'New Todo';
      state.value = state.value.filter(t => t.name !== text);
    },
  }
});

export const {markBossAsShowed, createBoss} = bossesSlice.actions;
