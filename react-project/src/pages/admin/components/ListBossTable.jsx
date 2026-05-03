import { deleteBossApi, getBossesApi, updateBossApi } from "../../../api/bossApi";
import { useEffect, useMemo, useState } from "react";
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

const getUserName = (user) => user?.full_name || user?.email || "-";
const getUserFilterValue = (user) => {
  if (!user) {
    return "";
  }

  return String(user.id || user.email || getUserName(user));
};

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
  const [filters, setFilters] = useState({
    name: "",
    createdBy: "all",
    updatedBy: "all",
    startDate: "",
    endDate: "",
  });

  const createdByOptions = useMemo(() => {
    const users = new Map();
    bosses.forEach((boss) => {
      if (boss.created_by) {
        users.set(getUserFilterValue(boss.created_by), getUserName(boss.created_by));
      }
    });

    return [...users.entries()].sort((firstUser, secondUser) =>
      firstUser[1].localeCompare(secondUser[1]),
    );
  }, [bosses]);

  const updatedByOptions = useMemo(() => {
    const users = new Map();
    bosses.forEach((boss) => {
      if (boss.updated_by) {
        users.set(getUserFilterValue(boss.updated_by), getUserName(boss.updated_by));
      }
    });

    return [...users.entries()].sort((firstUser, secondUser) =>
      firstUser[1].localeCompare(secondUser[1]),
    );
  }, [bosses]);

  const filteredBosses = useMemo(() => {
    const searchName = filters.name.trim().toLowerCase();
    const startDate = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
    const endDate = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null;

    return bosses.filter((boss) => {
      const updatedAt = boss.updated_at ? new Date(boss.updated_at) : null;
      const matchesName = !searchName || boss.name.toLowerCase().includes(searchName);
      const matchesCreatedBy =
        filters.createdBy === "all" ||
        getUserFilterValue(boss.created_by) === filters.createdBy;
      const matchesUpdatedBy =
        filters.updatedBy === "all" ||
        getUserFilterValue(boss.updated_by) === filters.updatedBy;
      const matchesStartDate = !startDate || (updatedAt && updatedAt >= startDate);
      const matchesEndDate = !endDate || (updatedAt && updatedAt <= endDate);

      return (
        matchesName &&
        matchesCreatedBy &&
        matchesUpdatedBy &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [bosses, filters]);

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

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      name: "",
      createdBy: "all",
      updatedBy: "all",
      startDate: "",
      endDate: "",
    });
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

      <form
        className="border rounded-3 p-3 mb-3 bg-body-tertiary"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
          <h6 className="mb-0">Filter Bosses</h6>
          <span className="small text-muted">
            Found: {filteredBosses.length} of {bosses.length} Bosses
          </span>
        </div>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-3">
            <label className="form-label small text-muted" htmlFor="bossNameFilter">
              Boss name
            </label>
            <input
              id="bossNameFilter"
              type="search"
              name="name"
              className="form-control"
              placeholder="Search boss..."
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-2">
            <label className="form-label small text-muted" htmlFor="bossCreatedByFilter">
              Created by
            </label>
            <select
              id="bossCreatedByFilter"
              name="createdBy"
              className="form-select"
              value={filters.createdBy}
              onChange={handleFilterChange}
            >
              <option value="all">All users</option>
              {createdByOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-lg-2">
            <label className="form-label small text-muted" htmlFor="bossUpdatedByFilter">
              Updated by
            </label>
            <select
              id="bossUpdatedByFilter"
              name="updatedBy"
              className="form-select"
              value={filters.updatedBy}
              onChange={handleFilterChange}
            >
              <option value="all">All users</option>
              {updatedByOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-lg-2">
            <label className="form-label small text-muted" htmlFor="bossStartDateFilter">
              From
            </label>
            <input
              id="bossStartDateFilter"
              type="date"
              name="startDate"
              className="form-control"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-2">
            <label className="form-label small text-muted" htmlFor="bossEndDateFilter">
              To
            </label>
            <input
              id="bossEndDateFilter"
              type="date"
              name="endDate"
              className="form-control"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="col-12 col-lg-1">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Created By</th>
              <th scope="col">Updated By</th>
              <th scope="col">Latest Update</th>
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
            ) : filteredBosses.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No bosses match the current filters
                </td>
              </tr>
            ) : (
              filteredBosses.map((boss, index) => {
                return (
                  <tr key={boss.id}>
                    <th scope="row">{index + 1}</th>
                    <td>{boss.name}</td>
                    <td>{getUserName(boss.created_by)}</td>
                    <td>{getUserName(boss.updated_by)}</td>
                    <td>{formatDateTime(boss.updated_at)}</td>
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
