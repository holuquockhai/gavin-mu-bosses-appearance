import { useEffect, useMemo, useState } from "react";
import { Modal } from "bootstrap";
import { useDispatch } from "react-redux";
import {
  createChannelApi,
  deleteChannelApi,
  getChannelsApi,
  updateChannelApi,
} from "../../api/channelApi";
import {
  createChannel,
  deleteChannel,
  setChannels,
  updateChannel,
} from "../../js/channelSlice";

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return detail || fallback;
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getUserName = (user) => user?.full_name || user?.email || "-";
const getUserFilterValue = (user) => {
  if (!user) {
    return "";
  }

  return String(user.id || user.email || getUserName(user));
};

export default function Channels() {
  const dispatch = useDispatch();
  const [channels, setLocalChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notification, setNotification] = useState(null);
  const [channelName, setChannelName] = useState("");
  const [channelToEdit, setChannelToEdit] = useState(null);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
    createdBy: "all",
    updatedBy: "all",
    startDate: "",
    endDate: "",
  });

  const createdByOptions = useMemo(() => {
    const users = new Map();
    channels.forEach((channel) => {
      if (channel.created_by) {
        users.set(getUserFilterValue(channel.created_by), getUserName(channel.created_by));
      }
    });

    return [...users.entries()].sort((firstUser, secondUser) =>
      firstUser[1].localeCompare(secondUser[1]),
    );
  }, [channels]);

  const updatedByOptions = useMemo(() => {
    const users = new Map();
    channels.forEach((channel) => {
      if (channel.updated_by) {
        users.set(getUserFilterValue(channel.updated_by), getUserName(channel.updated_by));
      }
    });

    return [...users.entries()].sort((firstUser, secondUser) =>
      firstUser[1].localeCompare(secondUser[1]),
    );
  }, [channels]);

  const filteredChannels = useMemo(() => {
    const searchName = filters.name.trim().toLowerCase();
    const startDate = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
    const endDate = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null;

    return channels.filter((channel) => {
      const updatedAt = channel.updated_at ? new Date(channel.updated_at) : null;
      const matchesName = !searchName || channel.name.toLowerCase().includes(searchName);
      const matchesCreatedBy =
        filters.createdBy === "all" ||
        getUserFilterValue(channel.created_by) === filters.createdBy;
      const matchesUpdatedBy =
        filters.updatedBy === "all" ||
        getUserFilterValue(channel.updated_by) === filters.updatedBy;
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
  }, [channels, filters]);

  const showModal = (id) => {
    const modalElement = document.getElementById(id);
    Modal.getOrCreateInstance(modalElement).show();
  };

  const hideModal = (id) => {
    const modalElement = document.getElementById(id);
    Modal.getOrCreateInstance(modalElement).hide();
  };

  const loadChannels = () => {
    setIsLoading(true);
    setError("");

    getChannelsApi()
      .then((data) => {
        setLocalChannels(data);
        dispatch(setChannels(data));
      })
      .catch((err) => {
        setLocalChannels([]);
        setError(getErrorMessage(err, "Failed to load channels"));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timeoutId);
  }, [notification]);

  const openCreateModal = () => {
    setChannelName("");
    setChannelToEdit(null);
    setFormError("");
    showModal("createChannelModal");
  };

  const openEditModal = (channel) => {
    setChannelToEdit(channel);
    setChannelName(channel.name);
    setFormError("");
    showModal("editChannelModal");
  };

  const openDeleteModal = (channel) => {
    setChannelToDelete(channel);
    setError("");
    showModal("deleteChannelModal");
  };

  const handleCreateChannel = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError("");

    try {
      const createdChannel = await createChannelApi({ name: channelName.trim() });
      setLocalChannels((currentChannels) => [...currentChannels, createdChannel]);
      dispatch(createChannel(createdChannel));
      setNotification({
        id: Date.now(),
        message: `Channel created successfully: ${createdChannel.name}`,
      });
      hideModal("createChannelModal");
      setChannelName("");
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to create channel"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateChannel = async (event) => {
    event.preventDefault();
    if (!channelToEdit) {
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const updatedChannel = await updateChannelApi(channelToEdit.id, {
        name: channelName.trim(),
      });
      setLocalChannels((currentChannels) =>
        currentChannels.map((channel) =>
          channel.id === updatedChannel.id ? updatedChannel : channel,
        ),
      );
      dispatch(updateChannel(updatedChannel));
      setNotification({
        id: Date.now(),
        message: `Channel updated successfully: ${updatedChannel.name}`,
      });
      hideModal("editChannelModal");
      setChannelToEdit(null);
      setChannelName("");
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to update channel"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!channelToDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteChannelApi(channelToDelete.id);
      setLocalChannels((currentChannels) =>
        currentChannels.filter((channel) => channel.id !== channelToDelete.id),
      );
      dispatch(deleteChannel(channelToDelete.id));
      setNotification({
        id: Date.now(),
        message: `Channel deleted successfully: ${channelToDelete.name}`,
      });
      hideModal("deleteChannelModal");
      setChannelToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete channel"));
    } finally {
      setIsDeleting(false);
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

  return (
    <div className="p-3 card rounded-4 unified">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h4 className="mb-0">Channels Management</h4>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
          + Create Channel
        </button>
      </div>

      {notification && (
        <div
          key={notification.id}
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {notification.message}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setNotification(null)}
          ></button>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <form
        className="border rounded-3 p-3 mb-3 bg-body-tertiary"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
          <h6 className="mb-0">Filter Channels</h6>
          <span className="small text-muted">
            Found: {filteredChannels.length} of {channels.length} Channels
          </span>
        </div>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-3">
            <label className="form-label small text-muted" htmlFor="channelNameFilter">
              Channel name
            </label>
            <input
              id="channelNameFilter"
              type="search"
              name="name"
              className="form-control"
              placeholder="Search channel..."
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-2">
            <label className="form-label small text-muted" htmlFor="channelCreatedByFilter">
              Created by
            </label>
            <select
              id="channelCreatedByFilter"
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
            <label className="form-label small text-muted" htmlFor="channelUpdatedByFilter">
              Updated by
            </label>
            <select
              id="channelUpdatedByFilter"
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
            <label className="form-label small text-muted" htmlFor="channelStartDateFilter">
              From
            </label>
            <input
              id="channelStartDateFilter"
              type="date"
              name="startDate"
              className="form-control"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-2">
            <label className="form-label small text-muted" htmlFor="channelEndDateFilter">
              To
            </label>
            <input
              id="channelEndDateFilter"
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
                  Loading channels...
                </td>
              </tr>
            ) : filteredChannels.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No channels match the current filters
                </td>
              </tr>
            ) : (
              filteredChannels.map((channel, index) => {
                return (
                  <tr key={channel.id}>
                    <th scope="row">{index + 1}</th>
                    <td>{channel.name}</td>
                    <td>{getUserName(channel.created_by)}</td>
                    <td>{getUserName(channel.updated_by)}</td>
                    <td>{formatDateTime(channel.updated_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openEditModal(channel)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => openDeleteModal(channel)}
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

      <ChannelFormModal
        id="createChannelModal"
        title="Create channel"
        value={channelName}
        onChange={setChannelName}
        onSubmit={handleCreateChannel}
        error={formError}
        isSaving={isSaving}
        actionLabel="Create"
        savingLabel="Creating..."
      />

      <ChannelFormModal
        id="editChannelModal"
        title="Edit channel"
        value={channelName}
        onChange={setChannelName}
        onSubmit={handleUpdateChannel}
        error={formError}
        isSaving={isSaving}
        actionLabel="Save"
        savingLabel="Saving..."
      />

      <div
        className="modal fade"
        id="deleteChannelModal"
        tabIndex="-1"
        aria-labelledby="deleteChannelModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="deleteChannelModalLabel">
                Delete channel
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete <strong>{channelToDelete?.name}</strong>?
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isDeleting}
                onClick={handleDeleteChannel}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelFormModal({
  id,
  title,
  value,
  onChange,
  onSubmit,
  error,
  isSaving,
  actionLabel,
  savingLabel,
}) {
  return (
    <div className="modal fade" id={id} tabIndex="-1" aria-labelledby={`${id}Label`} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={onSubmit}>
          <div className="modal-header">
            <h1 className="modal-title fs-5" id={`${id}Label`}>
              {title}
            </h1>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <label className="form-label" htmlFor={`${id}Name`}>
              Channel name
            </label>
            <input
              id={`${id}Name`}
              type="text"
              className="form-control"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              required
            />
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? savingLabel : actionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
