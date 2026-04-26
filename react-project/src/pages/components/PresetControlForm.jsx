import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "bootstrap";
import { applyBossVisibility } from "../../js/bossSlice";
import {
  deletePreset,
  renamePreset,
  savePresetChannel,
  setPresetSettings,
  updatePreset,
} from "../../js/presetSlice";
import PresetModal from "./PresetModal";
import { deletePresetApi, getPresetsApi, renamePresetApi, savePresetChannelApi } from "../../api/presetApi";

function PresetControlForm({ selectedChannel }) {
  const dispatch = useDispatch();
  const presetSettings = useSelector((state) => state.presetSettings.value);
  const bosses = useSelector((state) => state.bosses.value);
  const visibilityByChannel = useSelector((state) => state.bosses.visibilityByChannel);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetModalState, setPresetModalState] = useState(1);
  const [message, setMessage] = useState("");

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
  const presetChannelsSnapshot = selectedChannel
    ? {
        ...visibilityByChannel,
        [selectedChannel]: currentShowedBossIds,
      }
    : visibilityByChannel;

  const handleSavePreset = async () => {
    if (!selectedPreset || !selectedChannel) {
      setMessage("Select a preset and channel before saving.");
      return;
    }

    const payload = {
      presetId: selectedPreset.id,
      channel: selectedChannel,
      bossIds: currentShowedBossIds,
    };
    const updatedPreset = await savePresetChannelApi(selectedPreset.id, {
      channel: selectedChannel,
      boss_ids: currentShowedBossIds,
    });
    dispatch(savePresetChannel(payload));
    dispatch(updatePreset(updatedPreset));
    setMessage(`Saved ${selectedPreset.name} for ${selectedChannel}.`);
  };

  const handleApplyPreset = () => {
    if (!selectedPreset || !selectedChannel) {
      setMessage("Select a preset and channel before applying.");
      return;
    }

    const showedBossIds = selectedPreset.channels?.[selectedChannel] || [];
    dispatch(applyBossVisibility({ bossIds: showedBossIds, channel: selectedChannel }));
    setMessage(`Applied ${selectedPreset.name} for ${selectedChannel}.`);
  };

  const handlePresetCreated = (preset) => {
    dispatch(updatePreset(preset));
    setSelectedPresetId(String(preset.id));
    setMessage(`Created preset ${preset.name}.`);
  };

  const handlePresetRenamed = async (preset) => {
    const updatedPreset = await renamePresetApi(preset.presetId, preset.name);
    dispatch(renamePreset(preset));
    dispatch(updatePreset(updatedPreset));
    setMessage(`Renamed preset to ${updatedPreset.name}.`);
  };

  const handlePresetDeleted = async (presetId) => {
    await deletePresetApi(presetId);
    dispatch(deletePreset(presetId));
    setSelectedPresetId("");
    setMessage("Deleted preset.");
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
        {message && <div className="small text-muted mt-2">{message}</div>}
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
