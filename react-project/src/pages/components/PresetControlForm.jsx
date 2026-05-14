import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "bootstrap";
import { applyPresetVisibility } from "../../js/bossSlice";
import {
  deletePreset,
  renamePreset,
  setPresetSettings,
  updatePreset,
} from "../../js/presetSlice";
import PresetModal from "./PresetModal";
import { deletePresetApi, getPresetsApi, renamePresetApi, updatePresetApi } from "../../api/presetApi";
import { showGlobalMessage } from "../../utils/flashMessage";

function PresetControlForm({ selectedChannel }) {
  const dispatch = useDispatch();
  const presetSettings = useSelector((state) => state.presetSettings.value);
  const bosses = useSelector((state) => state.bosses.value);
  const visibilityByChannel = useSelector((state) => state.bosses.visibilityByChannel);
  const channels = useSelector((state) => state.channels.value);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetModalState, setPresetModalState] = useState(1);

  useEffect(() => {
    getPresetsApi()
      .then((presets) => dispatch(setPresetSettings(presets)))
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (selectedPresetId && !presetSettings.some((preset) => preset.id === Number(selectedPresetId))) {
      setSelectedPresetId("");
    }
  }, [presetSettings, selectedPresetId]);

  const openPresetModal = (modalState) => {
    setPresetModalState(modalState);
    const modalElement = document.getElementById("presetModal");
    const modalInstance = Modal.getOrCreateInstance(modalElement);

    modalInstance.show();
  };

  const selectedPreset = presetSettings.find((preset) => preset.id === Number(selectedPresetId));
  const currentShowedBossIds = bosses.filter((boss) => boss.isShowed).map((boss) => boss.id);
  const buildAllChannelSettings = ({ includeSelectedPresetBase = false } = {}) => {
    const mergedChannels = {
      ...(includeSelectedPresetBase ? selectedPreset?.channels || {} : {}),
      ...visibilityByChannel,
    };

    if (!channels.length) {
      return mergedChannels;
    }

    return channels.reduce((settings, channel) => {
      settings[channel.name] = currentShowedBossIds;
      return settings;
    }, {});
  };

  const presetChannelsSnapshot = buildAllChannelSettings();

  const handleSavePreset = async () => {
    if (!selectedPreset) {
      showGlobalMessage({
        message: "Select a preset before saving.",
        variant: "warning",
      });
      return;
    }

    const updatedPreset = await updatePresetApi(selectedPreset.id, {
      channels: buildAllChannelSettings({ includeSelectedPresetBase: true }),
    });
    dispatch(updatePreset(updatedPreset));
    showGlobalMessage({ message: `Preset ${selectedPreset.name} saved for all channels.` });
  };

  const handleApplyPreset = () => {
    if (!selectedPreset || !selectedChannel) {
      showGlobalMessage({
        message: "Select a preset and channel before applying.",
        variant: "warning",
      });
      return;
    }

    dispatch(applyPresetVisibility({
      channels: selectedPreset.channels || {},
      selectedChannel,
      channelNames: channels.map((channel) => channel.name),
    }));
    showGlobalMessage({ message: `Preset ${selectedPreset.name} applied to all channels.` });
  };

  const handlePresetCreated = (preset) => {
    dispatch(updatePreset(preset));
    setSelectedPresetId(String(preset.id));
    showGlobalMessage({ message: `Preset ${preset.name} created.` });
  };

  const handlePresetRenamed = async (preset) => {
    const updatedPreset = await renamePresetApi(preset.presetId, preset.name);
    dispatch(renamePreset(preset));
    dispatch(updatePreset(updatedPreset));
    showGlobalMessage({ message: `Preset renamed to ${updatedPreset.name}.` });
  };

  const handlePresetDeleted = async (presetId) => {
    await deletePresetApi(presetId);
    dispatch(deletePreset(presetId));
    setSelectedPresetId("");
    showGlobalMessage({ message: "Preset deleted." });
  };

  return (
    <>
      <div className="preset-control">
        <div className="d-flex flex-column flex-lg-row gap-2 align-items-lg-center">
          <div className="preset-select-wrap">
            <label className="small text-muted text-nowrap mb-1" htmlFor="presetSelect">Presets (max 3)</label>
            <select
              id="presetSelect"
              className="select form-select"
              value={selectedPresetId}
              onChange={(event) => setSelectedPresetId(event.target.value)}
            >
              <option value="">(no preset selected)</option>
              {presetSettings.map((setting) => (
                <option key={setting.id} value={setting.id}>
                  {setting.name}
                </option>
              ))}
            </select>
          </div>

          <div className="preset-actions d-flex flex-wrap gap-2">
            <button className="btn btn-outline-secondary" id="applyPresetBtn" onClick={handleApplyPreset}>
              Apply
            </button>
            <button className="btn btn-outline-success" id="savePresetBtn" onClick={handleSavePreset}>
              Save
            </button>
            <button
              className="btn btn-outline-primary"
              id="newPresetBtn"
              disabled={presetSettings.length >= 3}
              onClick={() => openPresetModal(1)}
            >
              New
            </button>
            <button
              className="btn btn-outline-info"
              id="renamePresetBtn"
              disabled={!selectedPreset}
              onClick={() => openPresetModal(2)}
            >
              Rename
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              id="deletePresetBtn"
              disabled={!selectedPreset}
              onClick={() => openPresetModal(3)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <PresetModal
        presetModalState={presetModalState}
        selectedPreset={selectedPreset}
        initialChannels={presetChannelsSnapshot}
        onCreated={handlePresetCreated}
        onRenamed={handlePresetRenamed}
        onDeleted={handlePresetDeleted}
      />
    </>
  );
}

export default PresetControlForm;
