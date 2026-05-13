import { createSlice } from '@reduxjs/toolkit';

export const bossesSlice = createSlice({
  name: 'bosses',

  initialState: {
    value: [],
    visibilityByChannel: {},
  },

  reducers: {
    setAllChannelVisibility: (state, action) => {
      const channelNames = action.payload?.channels || [];
      const showedBossIds = state.value
        .filter((item) => item.isShowed)
        .map((item) => item.id);

      if (channelNames.length > 0) {
        state.visibilityByChannel = channelNames.reduce((settings, channel) => {
          settings[channel] = showedBossIds;
          return settings;
        }, {});
      }
    },

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
      const channels = action.payload?.channels || [];
      const boss = state.value.find(t => t.id === id);
      if (boss) {
        boss.isShowed = !boss.isShowed ;
      }

      const showedBossIds = state.value
        .filter((item) => item.isShowed)
        .map((item) => item.id);

      if (channels.length > 0) {
        state.visibilityByChannel = channels.reduce((settings, channel) => {
          settings[channel] = showedBossIds;
          return settings;
        }, {});
      }
    },

    applyBossVisibility: (state, action) => {
      const showedBossIds = action.payload?.bossIds ?? action.payload;
      const channels = action.payload?.channels || [];

      state.value = state.value.map((boss) => ({
        ...boss,
        isShowed: showedBossIds.includes(boss.id),
      }));

      if (channels.length > 0) {
        state.visibilityByChannel = channels.reduce((settings, channel) => {
          settings[channel] = showedBossIds;
          return settings;
        }, {});
      }
    },

    applyPresetVisibility: (state, action) => {
      const channels = action.payload?.channels || {};
      const selectedChannel = action.payload?.selectedChannel;
      const channelNames = action.payload?.channelNames || [];
      const channelSettings = Object.entries(channels).reduce((settings, [channel, bossIds]) => {
        settings[channel] = Array.isArray(bossIds) ? [...bossIds] : [];
        return settings;
      }, {});
      const presetBossIds = channelSettings[selectedChannel]
        || Object.values(channelSettings).find((bossIds) => bossIds.length > 0)
        || [];

      state.visibilityByChannel = channelNames.length > 0
        ? channelNames.reduce((settings, channel) => {
          settings[channel] = presetBossIds;
          return settings;
        }, {})
        : channelSettings;
      state.value = state.value.map((boss) => ({
        ...boss,
        isShowed: presetBossIds.includes(boss.id),
      }));
    },

    showChannelVisibility: () => {
      // Boss setup cards are now global: selecting another channel keeps the same visible boss cards.
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
  setAllChannelVisibility,
  applyBossVisibility,
  applyPresetVisibility,
  showChannelVisibility,
} = bossesSlice.actions;
