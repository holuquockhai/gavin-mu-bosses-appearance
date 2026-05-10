import { createSlice } from '@reduxjs/toolkit';

export const bossesSlice = createSlice({
  name: 'bosses',

  initialState: {
    value: [],
    visibilityByChannel: {},
  },

  reducers: {
    setBosses: (state, action) => {
      state.value = action.payload.map((boss) => {
        const currentBoss = state.value.find((item) => item.id === boss.id);

        return {
          ...boss,
          isShowed: currentBoss?.isShowed ?? false,
        };
      });
    },

    createBoss: (state, action) => {
      state.value = [...state.value, {
        name: action.payload,
        isShowed: false,
      }];
    },

    markBossAsShowed: (state, action) => {
      const id = action.payload?.bossId ?? action.payload;
      const channel = action.payload?.channel;
      const boss = state.value.find(t => t.id === id);
      if (boss) {
        boss.isShowed = !boss.isShowed ;
      }

      if (channel) {
        state.visibilityByChannel[channel] = state.value
          .filter((item) => item.isShowed)
          .map((item) => item.id);
      }
    },

    applyBossVisibility: (state, action) => {
      const showedBossIds = action.payload?.bossIds ?? action.payload;
      const channel = action.payload?.channel;

      state.value = state.value.map((boss) => ({
        ...boss,
        isShowed: showedBossIds.includes(boss.id),
      }));

      if (channel) {
        state.visibilityByChannel[channel] = showedBossIds;
      }
    },

    applyPresetVisibility: (state, action) => {
      const channels = action.payload?.channels || {};
      const selectedChannel = action.payload?.selectedChannel;
      const channelSettings = Object.entries(channels).reduce((settings, [channel, bossIds]) => {
        settings[channel] = Array.isArray(bossIds) ? [...bossIds] : [];
        return settings;
      }, {});
      const showedBossIds = channelSettings[selectedChannel] || [];

      state.visibilityByChannel = channelSettings;
      state.value = state.value.map((boss) => ({
        ...boss,
        isShowed: showedBossIds.includes(boss.id),
      }));
    },

    showChannelVisibility: (state, action) => {
      const channel = action.payload;
      const showedBossIds = state.visibilityByChannel[channel] || [];

      state.value = state.value.map((boss) => ({
        ...boss,
        isShowed: showedBossIds.includes(boss.id),
      }));
    },

    deleteTodo: (state) => {
      const text = 'New Todo';
      state.value = state.value.filter(t => t.name !== text);
    },
  }
});

export const {
  markBossAsShowed,
  createBoss,
  setBosses,
  applyBossVisibility,
  applyPresetVisibility,
  showChannelVisibility,
} = bossesSlice.actions;
