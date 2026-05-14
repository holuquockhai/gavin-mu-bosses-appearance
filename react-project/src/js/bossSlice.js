import { createSlice } from '@reduxjs/toolkit';

const BOSS_VISIBILITY_STORAGE_KEY = "warlordsVisibleBossIds";

const getSavedVisibleBossIds = () => {
  try {
    const savedValue = localStorage.getItem(BOSS_VISIBILITY_STORAGE_KEY);
    const parsedValue = savedValue ? JSON.parse(savedValue) : null;

    return Array.isArray(parsedValue) ? parsedValue.map(Number) : null;
  } catch {
    return null;
  }
};

const normalizeBossIds = (bossIds = []) => (
  Array.isArray(bossIds) ? bossIds.map(Number).filter(Number.isFinite) : []
);

const saveVisibleBossIds = (bossIds) => {
  localStorage.setItem(BOSS_VISIBILITY_STORAGE_KEY, JSON.stringify(bossIds));
};

const persistVisibleBossIds = (state, bossIds) => {
  const normalizedBossIds = normalizeBossIds(bossIds);

  state.savedVisibleBossIds = normalizedBossIds;
  saveVisibleBossIds(normalizedBossIds);
};

export const bossesSlice = createSlice({
  name: 'bosses',

  initialState: {
    value: [],
    visibilityByChannel: {},
    savedVisibleBossIds: getSavedVisibleBossIds() || [],
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
      const savedVisibleBossIds = state.savedVisibleBossIds || [];

      state.value = action.payload.map((boss) => {
        const currentBoss = state.value.find((item) => item.id === boss.id);

        return {
          ...boss,
          isShowed: currentBoss ? currentBoss.isShowed : savedVisibleBossIds.includes(Number(boss.id)),
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
      persistVisibleBossIds(state, showedBossIds);

      if (channels.length > 0) {
        state.visibilityByChannel = channels.reduce((settings, channel) => {
          settings[channel] = showedBossIds;
          return settings;
        }, {});
      }
    },

    applyBossVisibility: (state, action) => {
      const showedBossIds = normalizeBossIds(action.payload?.bossIds ?? action.payload);
      const channels = action.payload?.channels || [];

      state.value = state.value.map((boss) => ({
        ...boss,
        isShowed: showedBossIds.includes(Number(boss.id)),
      }));
      persistVisibleBossIds(state, showedBossIds);

      if (channels.length > 0) {
        state.visibilityByChannel = channels.reduce((settings, channel) => {
          settings[channel] = showedBossIds;
          return settings;
        }, {});
      }
    },

    ensureBossesVisible: (state, action) => {
      const bossIds = normalizeBossIds(action.payload?.bossIds || []);
      const channels = action.payload?.channels || [];

      if (bossIds.length === 0) {
        return;
      }

      state.value = state.value.map((boss) => ({
        ...boss,
        isShowed: boss.isShowed || bossIds.includes(Number(boss.id)),
      }));

      const showedBossIds = state.value
        .filter((item) => item.isShowed)
        .map((item) => item.id);
      persistVisibleBossIds(state, showedBossIds);

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
      const presetBossIds = normalizeBossIds(channelSettings[selectedChannel]
        || Object.values(channelSettings).find((bossIds) => bossIds.length > 0)
        || []);

      state.visibilityByChannel = channelNames.length > 0
        ? channelNames.reduce((settings, channel) => {
          settings[channel] = presetBossIds;
          return settings;
        }, {})
        : channelSettings;
      state.value = state.value.map((boss) => ({
        ...boss,
        isShowed: presetBossIds.includes(Number(boss.id)),
      }));
      persistVisibleBossIds(state, presetBossIds);
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
  ensureBossesVisible,
  applyPresetVisibility,
  showChannelVisibility,
} = bossesSlice.actions;
