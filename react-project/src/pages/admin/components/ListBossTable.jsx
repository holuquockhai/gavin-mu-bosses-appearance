import { deleteBossApi, getBossesApi, updateBossApi } from "../../../api/bossApi";
import { useEffect, useState } from "react";
import { Modal } from "bootstrap";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return detail || fallback;
};

const getBossActor = (boss) => boss.updated_by || boss.created_by || {};

const ListBossTable = ({ refreshKey, onDeleted, onUpdated }) => {
  const [bosses, setBosses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [bossToDelete, setBossToDelete] = useState(null);
  const [bossToEdit, setBossToEdit] = useState(null);
  const [editName, setEditName] = useState("");

  const openEditModal = (boss) => {
    setBossToEdit(boss);
    setEditName(boss.name);
    setEditError("");
    const modalElement = document.getElementById("editBossModal");
    const modalInstance = Modal.getOrCreateInstance(modalElement);

    modalInstance.show();
  };

  const closeEditModal = () => {
    const modalElement = document.getElementById("editBossModal");
    const modalInstance = Modal.getOrCreateInstance(modalElement);

    modalInstance.hide();
  };

  const openDeleteConfirm = (boss) => {
    setBossToDelete(boss);
    const modalElement = document.getElementById("deleteBossModal");
    const modalInstance = Modal.getOrCreateInstance(modalElement);

    modalInstance.show();
  };

  const closeDeleteConfirm = () => {
    const modalElement = document.getElementById("deleteBossModal");
    const modalInstance = Modal.getOrCreateInstance(modalElement);

    modalInstance.hide();
  };

  const handleDeleteBoss = async () => {
    if (!bossToDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteBossApi(bossToDelete.id);
      setBosses((currentBosses) => currentBosses.filter((boss) => boss.id !== bossToDelete.id));
      onDeleted?.(bossToDelete);
      closeDeleteConfirm();
      setBossToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete boss"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateBoss = async (event) => {
    event.preventDefault();

    if (!bossToEdit) {
      return;
    }

    setIsUpdating(true);
    setEditError("");

    try {
      const updatedBoss = await updateBossApi(bossToEdit.id, { name: editName.trim() });
      setBosses((currentBosses) =>
        currentBosses.map((boss) => (boss.id === updatedBoss.id ? updatedBoss : boss)),
      );
      onUpdated?.(updatedBoss);
      closeEditModal();
      setBossToEdit(null);
      setEditName("");
    } catch (err) {
      setEditError(getErrorMessage(err, "Failed to update boss"));
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setError("");

    getBossesApi()
      .then((data) => setBosses(data))
      .catch((err) => {
        setBosses([]);
        setError(getErrorMessage(err, "Failed to load bosses"));
      })
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Latest Update</th>
              <th scope="col">By User</th>
              <th scope="col">Email</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  Loading bosses...
                </td>
              </tr>
            ) : bosses.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No bosses found
                </td>
              </tr>
            ) : (
              bosses.map((boss, index) => {
                const actor = getBossActor(boss);

                return (
                  <tr key={boss.id}>
                    <th scope="row">{index + 1}</th>
                    <td>{boss.name}</td>
                    <td>{formatDateTime(boss.updated_at)}</td>
                    <td>{actor.full_name || "-"}</td>
                    <td>{actor.email || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openEditModal(boss)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => openDeleteConfirm(boss)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        className="modal fade"
        id="deleteBossModal"
        tabIndex="-1"
        aria-labelledby="deleteBossModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="deleteBossModalLabel">
                Delete boss
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete <strong>{bossToDelete?.name}</strong>?
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isDeleting}
                onClick={handleDeleteBoss}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="editBossModal"
        tabIndex="-1"
        aria-labelledby="editBossModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleUpdateBoss}>
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="editBossModalLabel">
                  Edit boss
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <label className="form-label" htmlFor="editBossName">
                  Boss name
                </label>
                <input
                  id="editBossName"
                  type="text"
                  className="form-control"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                />
                {editError && <div className="alert alert-danger mt-3 mb-0">{editError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListBossTable;
