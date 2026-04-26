import { useState } from "react";
import { createBossApi } from "../../../api/bossApi";
import { Modal } from "bootstrap";

const CreateBossModal = ({ onCreated }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => {
    const modalElement = document.getElementById("createBossModal");
    const modalInstance = Modal.getOrCreateInstance(modalElement);

    modalInstance.hide();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await createBossApi({ name: name.trim() });
      setName("");
      onCreated?.(data);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create boss");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <div
        className="modal fade"
        id="createBossModal"
        tabIndex="-1"
        aria-labelledby="createBossModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="createBossModalLabel">
                  Create boss
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <label className="form-label" htmlFor="createBossName">
                  Boss name
                </label>
                <input
                  id="createBossName"
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateBossModal;
