import { useEffect, useMemo, useState } from "react";
import { Modal } from "bootstrap";
import { useDispatch } from "react-redux";
import {
  createUserApi,
  deleteUserApi,
  getUsersApi,
  updateUserApi,
} from "../../api/userApi";
import { createNotificationApi } from "../../api/notificationApi";
import { addUserCreatedNotification } from "../../js/notificationSlice";
import { getUser } from "../../utils/auth";

const emptyForm = {
  email: "",
  full_name: "",
  password: "",
  is_active: true,
};

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return detail || fallback;
};

const formatRoles = (roles = []) =>
  roles.map((role) => role.name || role).filter(Boolean);

export default function Users() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notification, setNotification] = useState(null);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    role: "all",
  });

  const roleOptions = useMemo(() => {
    const roles = new Set();

    users.forEach((user) => {
      formatRoles(user.roles).forEach((role) => roles.add(role));
    });

    return [...roles].sort((firstRole, secondRole) =>
      firstRole.localeCompare(secondRole),
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    const searchText = filters.search.trim().toLowerCase();

    return users.filter((user) => {
      const userRoles = formatRoles(user.roles);
      const matchesSearch =
        !searchText ||
        (user.full_name || "").toLowerCase().includes(searchText) ||
        user.email.toLowerCase().includes(searchText);
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && user.is_active) ||
        (filters.status === "inactive" && !user.is_active);
      const matchesRole =
        filters.role === "all" || userRoles.includes(filters.role);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [filters, users]);

  const loadUsers = () => {
    setIsLoading(true);
    setError("");

    getUsersApi()
      .then((data) => setUsers(data))
      .catch((err) => {
        setUsers([]);
        setError(getErrorMessage(err, "Failed to load users"));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timeoutId);
  }, [notification]);

  const showModal = (id) => {
    const modalElement = document.getElementById(id);
    Modal.getOrCreateInstance(modalElement).show();
  };

  const hideModal = (id) => {
    const modalElement = document.getElementById(id);
    Modal.getOrCreateInstance(modalElement).hide();
  };

  const openCreateModal = () => {
    setCreateForm(emptyForm);
    setFormError("");
    showModal("createUserModal");
  };

  const openEditModal = (user) => {
    setUserToEdit(user);
    setEditForm({
      email: user.email,
      full_name: user.full_name || "",
      password: "",
      is_active: Boolean(user.is_active),
    });
    setFormError("");
    showModal("editUserModal");
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setError("");
    showModal("deleteUserModal");
  };

  const handleCreateChange = (event) => {
    const { name, type, checked, value } = event.target;
    setCreateForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditChange = (event) => {
    const { name, type, checked, value } = event.target;
    setEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      search: "",
      status: "all",
      role: "all",
    });
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError("");

    try {
      const createdUser = await createUserApi({
        email: createForm.email.trim(),
        full_name: createForm.full_name.trim() || null,
        password: createForm.password,
        is_active: createForm.is_active,
      });
      setUsers((currentUsers) => [createdUser, ...currentUsers]);
      setNotification({
        id: Date.now(),
        message: `User created successfully: ${createdUser.email}`,
      });
      hideModal("createUserModal");
      setCreateForm(emptyForm);

      const currentUser = getUser();
      const actorName =
        currentUser?.full_name || currentUser?.email || "Someone";
      const notificationPayload = {
        actorName,
        userName: createdUser.full_name || createdUser.email,
      };
      dispatch(addUserCreatedNotification(notificationPayload));
      createNotificationApi({
        type: "user-created",
        payload: notificationPayload,
      }).catch(() => {});
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to create user"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!userToEdit) {
      return;
    }

    setIsSaving(true);
    setFormError("");

    const payload = {
      email: editForm.email.trim(),
      full_name: editForm.full_name.trim() || null,
      is_active: editForm.is_active,
    };

    if (editForm.password) {
      payload.password = editForm.password;
    }

    try {
      const updatedUser = await updateUserApi(userToEdit.id, payload);
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user,
        ),
      );
      setNotification({
        id: Date.now(),
        message: `User updated successfully: ${updatedUser.email}`,
      });
      hideModal("editUserModal");
      setUserToEdit(null);
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to update user"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteUserApi(userToDelete.id);
      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== userToDelete.id),
      );
      setNotification({
        id: Date.now(),
        message: `User deleted successfully: ${userToDelete.email}`,
      });
      hideModal("deleteUserModal");
      setUserToDelete(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete user"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-3 card rounded-4 unified">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h4 className="mb-0">Users Management</h4>
        <span className="small text-muted">
          Found: {filteredUsers.length} of {users.length} Users
        </span>
        <button
          type="button"
          className="btn btn-outline-success me-2"
          onClick={openCreateModal}
        >
          + Create User
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
        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-5">
            <label className="form-label small text-muted" htmlFor="userSearch">
              Search by name or email
            </label>
            <input
              id="userSearch"
              type="search"
              name="search"
              className="form-control"
              placeholder="Search users..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label small text-muted" htmlFor="userStatusFilter">
              Status
            </label>
            <select
              id="userStatusFilter"
              name="status"
              className="form-select"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label small text-muted" htmlFor="userRoleFilter">
              Role
            </label>
            <select
              id="userRoleFilter"
              name="role"
              className="form-select"
              value={filters.role}
              onChange={handleFilterChange}
            >
              <option value="all">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
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
              <th scope="col">Email</th>
              <th scope="col">Roles</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No users match the current filters
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <th scope="row">{index + 1}</th>
                  <td>{user.full_name || "-"}</td>
                  <td>{user.email}</td>
                  <td>
                    {formatRoles(user.roles).length === 0 ? (
                      <span className="text-muted">-</span>
                    ) : (
                      formatRoles(user.roles).map((role) => (
                        <span
                          key={role}
                          className="badge text-bg-secondary me-1"
                        >
                          {role}
                        </span>
                      ))
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${user.is_active ? "text-bg-success" : "text-bg-warning"}`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => openDeleteModal(user)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        className="modal fade"
        id="createUserModal"
        tabIndex="-1"
        aria-labelledby="createUserModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <form className="modal-content" onSubmit={handleCreateUser}>
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="createUserModalLabel">
                Create user
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <UserForm
                form={createForm}
                onChange={handleCreateChange}
                passwordRequired
              />
              {formError && (
                <div className="alert alert-danger mt-3 mb-0">{formError}</div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className="modal fade"
        id="editUserModal"
        tabIndex="-1"
        aria-labelledby="editUserModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <form className="modal-content" onSubmit={handleUpdateUser}>
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="editUserModalLabel">
                Edit user
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <UserForm form={editForm} onChange={handleEditChange} />
              {formError && (
                <div className="alert alert-danger mt-3 mb-0">{formError}</div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className="modal fade"
        id="deleteUserModal"
        tabIndex="-1"
        aria-labelledby="deleteUserModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="deleteUserModalLabel">
                Delete user
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete{" "}
              <strong>{userToDelete?.email}</strong>?
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isDeleting}
                onClick={handleDeleteUser}
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

function UserForm({ form, onChange, passwordRequired = false }) {
  return (
    <>
      <div className="mb-3">
        <label
          className="form-label"
          htmlFor={passwordRequired ? "createFullName" : "editFullName"}
        >
          Full name
        </label>
        <input
          id={passwordRequired ? "createFullName" : "editFullName"}
          type="text"
          name="full_name"
          className="form-control"
          value={form.full_name}
          onChange={onChange}
        />
      </div>

      <div className="mb-3">
        <label
          className="form-label"
          htmlFor={passwordRequired ? "createEmail" : "editEmail"}
        >
          Email
        </label>
        <input
          id={passwordRequired ? "createEmail" : "editEmail"}
          type="email"
          name="email"
          className="form-control"
          value={form.email}
          onChange={onChange}
          required
        />
      </div>

      <div className="mb-3">
        <label
          className="form-label"
          htmlFor={passwordRequired ? "createPassword" : "editPassword"}
        >
          Password
        </label>
        <input
          id={passwordRequired ? "createPassword" : "editPassword"}
          type="password"
          name="password"
          className="form-control"
          value={form.password}
          onChange={onChange}
          minLength="6"
          required={passwordRequired}
          placeholder={
            passwordRequired ? "" : "Leave blank to keep current password"
          }
        />
      </div>

      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id={passwordRequired ? "createIsActive" : "editIsActive"}
          name="is_active"
          checked={form.is_active}
          onChange={onChange}
        />
        <label
          className="form-check-label"
          htmlFor={passwordRequired ? "createIsActive" : "editIsActive"}
        >
          Active
        </label>
      </div>
    </>
  );
}
