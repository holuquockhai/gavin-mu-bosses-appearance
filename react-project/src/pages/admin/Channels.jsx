import { useEffect, useState } from "react";
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

const getChannelActor = (channel) => channel.updated_by || channel.created_by || {};

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
                  Loading channels...
                </td>
              </tr>
            ) : channels.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No channels found
                </td>
              </tr>
            ) : (
              channels.map((channel, index) => {
                const actor = getChannelActor(channel);

                return (
                  <tr key={channel.id}>
                    <th scope="row">{index + 1}</th>
                    <td>{channel.name}</td>
                    <td>{formatDateTime(channel.updated_at)}</td>
                    <td>{actor.full_name || "-"}</td>
                    <td>{actor.email || "-"}</td>
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
