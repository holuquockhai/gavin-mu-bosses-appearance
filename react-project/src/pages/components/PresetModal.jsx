import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Modal } from "bootstrap";
import { createPreset } from "../../js/presetSlice";
import { createPresetApi } from "../../api/presetApi";

function PresetModal({ presetModalState, selectedPreset, initialChannels, onCreated, onRenamed, onDeleted }) {
  const dispatch = useDispatch();
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    setPresetName(presetModalState === 2 ? selectedPreset?.name || "" : "");
  }, [presetModalState, selectedPreset]);

  const closeModal = () => {
    const modalElement = document.getElementById("presetModal");
    const modalInstance = Modal.getOrCreateInstance(modalElement);

    modalInstance.hide();
  };

  const generateModalTitle = () => {
    switch (presetModalState) {
      case 1:
        return "New";
      case 2:
        return "Rename";
      case 3:
        return "Delete";
      default:
        return "Preset";
    }
  };

  const handleSave = async () => {
    const trimmedName = presetName.trim();

    if (presetModalState === 1 && trimmedName) {
      const preset = await createPresetApi({
        name: trimmedName,
        channels: initialChannels || {},
      });

      dispatch(createPreset(preset));
      onCreated?.(preset);
      closeModal();
      return;
    }

    if (presetModalState === 2 && selectedPreset && trimmedName) {
      onRenamed?.({
        presetId: selectedPreset.id,
        name: trimmedName,
      });
      closeModal();
    }
  };

  const handleDelete = () => {
    if (selectedPreset) {
      onDeleted?.(selectedPreset.id);
      closeModal();
    }
  };

  return (
    <>
      <div className="modal fade" id="presetModal" tabIndex="-1" aria-labelledby="newPresetModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="newPresetModalLabel">{generateModalTitle()} Preset</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {presetModalState !== 3 ? (
                <form onSubmit={(event) => event.preventDefault()}>
                  <div className="mb-3">
                    <label htmlFor="preset-name" className="col-form-label">Preset Name:</label>
                    <input
                      type="text"
                      value={presetName}
                      className="form-control"
                      id="preset-name"
                      onChange={(event) => setPresetName(event.target.value)}
                    />
                  </div>
                </form>
              ) : (
                <div className="mb-3">
                  <p className="mb-0">Are you sure you want to delete <strong>{selectedPreset?.name}</strong>?</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {presetModalState === 3 ? (
                <>
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  <button type="button" className="btn btn-primary" onClick={handleSave}>
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PresetModal;
