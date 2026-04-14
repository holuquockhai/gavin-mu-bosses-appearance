import { useState } from "react";
import { createBossApi } from "../../../api/bossApi";

const CreateBossModal = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const data = await createBossApi({ name });
      setMessage(`Boss created: ${data.name}`);
      setName("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create boss");
    }
  };
  return (
    <>
      <div
        className="modal fade"
        id="createBossModal"
        tabindex="-1"
        aria-labelledby="createBossModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="createBossModalLabel">
                Create New Boss
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Boss name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <button type="submit">Create</button>
              </form>

              {message && <p>{message}</p>}
              {error && <p>{error}</p>}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateBossModal;
