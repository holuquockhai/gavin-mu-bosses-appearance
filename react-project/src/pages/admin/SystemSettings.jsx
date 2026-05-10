import { useEffect, useState } from "react";
import { Modal } from "bootstrap";
import { useNavigate } from "react-router-dom";
import {
  downloadSystemSettingsBackupApi,
  factoryResetWebsiteApi,
  getSystemSettingsApi,
  restoreSystemSettingsBackupApi,
  sendSystemSettingsTestEmailApi,
  updateBrandingSettingsApi,
  updateSystemSettingsApi,
} from "../../api/systemSettingsApi";
import { USER_API_URL } from "../../api/userApi";
import { logout } from "../../utils/auth";

const initialForm = {
  app_secret_key: "",
  app_base_url: "http://127.0.0.1:5173",
  api_base_url: "http://127.0.0.1:8000",
  site_logo_url: "",
  site_sublogo_url: "",
  site_head_title: "WARLORDS",
  maintenance_enabled: false,
  maintenance_message: "Wardlords Site is currently under maintenance. Please check back shortly.",
  smtp_host: "",
  smtp_port: 587,
  smtp_username: "",
  smtp_password: "",
  smtp_from_email: "",
  smtp_from_name: "Wardlords",
  smtp_use_tls: true,
  smtp_use_ssl: false,
  email_queue_batch_size: 20,
  mysql_host: "127.0.0.1",
  mysql_port: 3306,
  mysql_database: "mu_bosses",
  mysql_username: "root",
  mysql_password: "",
  mysql_charset: "utf8mb4",
};

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return detail || fallback;
};

function SystemSettings() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreInputKey, setRestoreInputKey] = useState(0);
  const [smtpPasswordConfigured, setSmtpPasswordConfigured] = useState(false);
  const [mysqlPasswordConfigured, setMysqlPasswordConfigured] = useState(false);
  const [brandingFiles, setBrandingFiles] = useState({
    site_logo: null,
    site_sublogo: null,
  });
  const [testRecipient, setTestRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getSystemSettingsApi()
      .then((settings) => {
        setForm({
          ...initialForm,
          ...settings,
          smtp_password: "",
          mysql_password: "",
        });
        setSmtpPasswordConfigured(Boolean(settings.smtp_password_configured));
        setMysqlPasswordConfigured(Boolean(settings.mysql_password_configured));
      })
      .catch((err) => setError(getErrorMessage(err, "Failed to load system settings")))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      ...(name === "smtp_use_ssl" && checked ? { smtp_use_tls: false, smtp_port: 465 } : {}),
      ...(name === "smtp_use_tls" && checked ? { smtp_use_ssl: false, smtp_port: 587 } : {}),
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    setBrandingFiles((currentFiles) => ({
      ...currentFiles,
      [name]: files?.[0] || null,
    }));
  };

  const applySavedSettings = (settings) => {
    setForm({
      ...initialForm,
      ...settings,
      smtp_password: "",
      mysql_password: "",
    });
    setSmtpPasswordConfigured(Boolean(settings.smtp_password_configured));
    setMysqlPasswordConfigured(Boolean(settings.mysql_password_configured));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const nullableFields = [
        "app_secret_key",
        "app_base_url",
        "api_base_url",
        "site_logo_url",
        "site_sublogo_url",
        "site_head_title",
        "maintenance_message",
        "smtp_host",
        "smtp_username",
        "smtp_password",
        "smtp_from_email",
        "smtp_from_name",
        "mysql_host",
        "mysql_database",
        "mysql_username",
        "mysql_password",
        "mysql_charset",
      ];
      const payload = {
        ...form,
        smtp_port: Number(form.smtp_port) || 587,
        email_queue_batch_size: Number(form.email_queue_batch_size) || 20,
        mysql_port: Number(form.mysql_port) || 3306,
      };

      nullableFields.forEach((field) => {
        if (typeof payload[field] === "string" && !payload[field].trim()) {
          payload[field] = null;
        }
      });

      let savedSettings = await updateSystemSettingsApi(payload);

      const hasBrandingUpload = brandingFiles.site_logo || brandingFiles.site_sublogo;
      if (hasBrandingUpload) {
        const savedBranding = await updateBrandingSettingsApi({
          site_head_title: payload.site_head_title || "WARLORDS",
          ...brandingFiles,
        });
        savedSettings = {
          ...savedSettings,
          ...savedBranding,
        };
        setBrandingFiles({ site_logo: null, site_sublogo: null });
      }

      applySavedSettings(savedSettings);
      setMessage("System settings have been saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save system settings"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testRecipient.trim()) {
      setError("Enter a recipient email before sending a test.");
      return;
    }

    setIsTesting(true);
    setMessage("");
    setError("");

    try {
      const data = await sendSystemSettingsTestEmailApi(testRecipient.trim());
      setMessage(data.message || "Test email sent successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not send test email"));
    } finally {
      setIsTesting(false);
    }
  };

  const handleDownloadBackup = async () => {
    setIsDownloadingBackup(true);
    setMessage("");
    setError("");

    try {
      const response = await downloadSystemSettingsBackupApi();
      const contentDisposition = response.headers["content-disposition"] || "";
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || "warlords-system-settings-backup.json";
      const downloadUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setMessage("System settings backup has been downloaded.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to download system settings backup"));
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      setError("Choose a JSON backup file before restoring settings.");
      return;
    }

    setIsRestoringBackup(true);
    setMessage("");
    setError("");

    try {
      const restoredSettings = await restoreSystemSettingsBackupApi(restoreFile);
      applySavedSettings(restoredSettings);
      setRestoreFile(null);
      setRestoreInputKey((currentKey) => currentKey + 1);
      setMessage("System settings backup has been restored successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to restore system settings backup"));
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const showFactoryResetModal = () => {
    setResetConfirmText("");
    setError("");
    const modalElement = document.getElementById("factoryResetModal");
    Modal.getOrCreateInstance(modalElement).show();
  };

  const hideFactoryResetModal = () => {
    const modalElement = document.getElementById("factoryResetModal");
    Modal.getOrCreateInstance(modalElement).hide();
  };

  const handleFactoryReset = async () => {
    if (resetConfirmText !== "RESET") {
      setError('Type "RESET" to confirm website factory reset.');
      return;
    }

    setIsResetting(true);
    setMessage("");
    setError("");

    try {
      await factoryResetWebsiteApi();
      hideFactoryResetModal();
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Factory reset failed"));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-3 card rounded-4 unified">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
        <div>
          <h4 className="mb-1">System Settings</h4>
          <p className="small text-muted mb-0">Manage secret key and SMTP settings for account emails.</p>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <p className="small text-muted mb-0">Loading settings...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="d-grid gap-3">
            <div className="card">
              <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
                <h5 className="mb-1">Application</h5>
                <p className="small text-muted mb-0">Core application URL and token secret.</p>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="appSecretKey">Secret key</label>
                    <input
                      id="appSecretKey"
                      name="app_secret_key"
                      type="text"
                      className="form-control"
                      minLength={8}
                      value={form.app_secret_key || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="appBaseUrl">Frontend base URL</label>
                    <input
                      id="appBaseUrl"
                      name="app_base_url"
                      type="url"
                      className="form-control"
                      value={form.app_base_url || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
                <h5 className="mb-1">API Settings</h5>
                <p className="small text-muted mb-0">Public backend API endpoint used by deployment and emails.</p>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" htmlFor="apiBaseUrl">API base URL</label>
                    <input
                      id="apiBaseUrl"
                      name="api_base_url"
                      type="url"
                      className="form-control"
                      placeholder="https://your-domain.com/api"
                      value={form.api_base_url || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
                <h5 className="mb-1">Site Branding</h5>
                <p className="small text-muted mb-0">Upload the main logo, sublogo, and navigation title.</p>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-lg-4">
                    <label className="form-label" htmlFor="siteHeadTitle">Head title</label>
                    <input
                      id="siteHeadTitle"
                      name="site_head_title"
                      type="text"
                      className="form-control"
                      value={form.site_head_title || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-4">
                    <label className="form-label" htmlFor="siteLogo">Site logo</label>
                    <input
                      id="siteLogo"
                      name="site_logo"
                      type="file"
                      className="form-control"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                    />
                    {form.site_logo_url && (
                      <img
                        src={`${USER_API_URL}${form.site_logo_url}`}
                        alt="Current site logo"
                        className="mt-2 rounded border"
                        style={{ height: "48px", width: "auto" }}
                      />
                    )}
                  </div>

                  <div className="col-12 col-lg-4">
                    <label className="form-label" htmlFor="siteSublogo">Sublogo</label>
                    <input
                      id="siteSublogo"
                      name="site_sublogo"
                      type="file"
                      className="form-control"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                    />
                    {form.site_sublogo_url && (
                      <img
                        src={`${USER_API_URL}${form.site_sublogo_url}`}
                        alt="Current sublogo"
                        className="mt-2 rounded border"
                        style={{ height: "36px", width: "auto" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
                <h5 className="mb-1">Maintenance</h5>
                <p className="small text-muted mb-0">Temporarily block normal users while admins continue working.</p>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input
                        id="maintenanceEnabled"
                        name="maintenance_enabled"
                        type="checkbox"
                        className="form-check-input"
                        checked={Boolean(form.maintenance_enabled)}
                        onChange={handleChange}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="maintenanceEnabled">
                        Enable maintenance mode
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label" htmlFor="maintenanceMessage">Maintenance message</label>
                    <textarea
                      id="maintenanceMessage"
                      name="maintenance_message"
                      className="form-control"
                      rows={3}
                      value={form.maintenance_message || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
                <h5 className="mb-1">SMTP Mail</h5>
                <p className="small text-muted mb-0">Used for forgot password and account activation emails.</p>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-lg-8">
                    <label className="form-label" htmlFor="smtpHost">SMTP host</label>
                    <input
                      id="smtpHost"
                      name="smtp_host"
                      type="text"
                      className="form-control"
                      value={form.smtp_host || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-4">
                    <label className="form-label" htmlFor="smtpPort">Port</label>
                    <input
                      id="smtpPort"
                      name="smtp_port"
                      type="number"
                      min="1"
                      max="65535"
                      className="form-control"
                      value={form.smtp_port || 587}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="smtpUsername">Username</label>
                    <input
                      id="smtpUsername"
                      name="smtp_username"
                      type="text"
                      className="form-control"
                      value={form.smtp_username || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="smtpPassword">
                      Password {smtpPasswordConfigured && <span className="text-muted fw-normal">(saved)</span>}
                    </label>
                    <input
                      id="smtpPassword"
                      name="smtp_password"
                      type="password"
                      className="form-control"
                      placeholder={smtpPasswordConfigured ? "Leave blank to keep current password" : ""}
                      value={form.smtp_password || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="smtpFromEmail">From email</label>
                    <input
                      id="smtpFromEmail"
                      name="smtp_from_email"
                      type="email"
                      className="form-control"
                      value={form.smtp_from_email || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="smtpFromName">From name</label>
                    <input
                      id="smtpFromName"
                      name="smtp_from_name"
                      type="text"
                      className="form-control"
                      value={form.smtp_from_name || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 d-flex flex-wrap gap-4">
                    <div className="form-check">
                      <input
                        id="smtpUseTls"
                        name="smtp_use_tls"
                        type="checkbox"
                        className="form-check-input"
                        checked={Boolean(form.smtp_use_tls)}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="smtpUseTls">Use TLS</label>
                    </div>

                    <div className="form-check">
                      <input
                        id="smtpUseSsl"
                        name="smtp_use_ssl"
                        type="checkbox"
                        className="form-check-input"
                        checked={Boolean(form.smtp_use_ssl)}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="smtpUseSsl">Use SSL</label>
                    </div>
                    <p className="small text-muted mb-0 w-100">
                      Use TLS with port 587, or SSL with port 465. Do not enable both.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
                <h5 className="mb-1">Email Queue</h5>
                <p className="small text-muted mb-0">Control how many queued emails the mail worker sends per run.</p>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-lg-4">
                    <label className="form-label" htmlFor="emailQueueBatchSize">Emails per cron run</label>
                    <input
                      id="emailQueueBatchSize"
                      name="email_queue_batch_size"
                      type="number"
                      min="1"
                      max="200"
                      className="form-control"
                      value={form.email_queue_batch_size || 20}
                      onChange={handleChange}
                    />
                    <p className="small text-muted mb-0 mt-1">
                      Maximum queued emails sent each time the mail worker runs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
                <h5 className="mb-1">MySQL Server</h5>
                <p className="small text-muted mb-0">
                  Store database server information for deployment and administration.
                </p>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-lg-8">
                    <label className="form-label" htmlFor="mysqlHost">MySQL host</label>
                    <input
                      id="mysqlHost"
                      name="mysql_host"
                      type="text"
                      className="form-control"
                      value={form.mysql_host || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-4">
                    <label className="form-label" htmlFor="mysqlPort">Port</label>
                    <input
                      id="mysqlPort"
                      name="mysql_port"
                      type="number"
                      min="1"
                      max="65535"
                      className="form-control"
                      value={form.mysql_port || 3306}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="mysqlDatabase">Database name</label>
                    <input
                      id="mysqlDatabase"
                      name="mysql_database"
                      type="text"
                      className="form-control"
                      value={form.mysql_database || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="mysqlCharset">Charset</label>
                    <input
                      id="mysqlCharset"
                      name="mysql_charset"
                      type="text"
                      className="form-control"
                      value={form.mysql_charset || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="mysqlUsername">Username</label>
                    <input
                      id="mysqlUsername"
                      name="mysql_username"
                      type="text"
                      className="form-control"
                      value={form.mysql_username || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 col-lg-6">
                    <label className="form-label" htmlFor="mysqlPassword">
                      Password {mysqlPasswordConfigured && <span className="text-muted fw-normal">(saved)</span>}
                    </label>
                    <input
                      id="mysqlPassword"
                      name="mysql_password"
                      type="password"
                      className="form-control"
                      placeholder={mysqlPasswordConfigured ? "Leave blank to keep current password" : ""}
                      value={form.mysql_password || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
                <h5 className="mb-1">Backup & Restore Settings</h5>
                <p className="small text-muted mb-0">Download or restore system settings with a JSON backup file.</p>
              </div>
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={handleDownloadBackup}
                      disabled={isDownloadingBackup}
                    >
                      {isDownloadingBackup ? "Downloading..." : "Download Settings JSON"}
                    </button>
                  </div>

                  <div className="col-12 col-lg-5">
                    <label className="form-label" htmlFor="settingsBackupFile">Restore JSON file</label>
                    <input
                      key={restoreInputKey}
                      id="settingsBackupFile"
                      type="file"
                      className="form-control"
                      accept="application/json,.json"
                      onChange={(event) => setRestoreFile(event.target.files?.[0] || null)}
                      disabled={isRestoringBackup}
                    />
                  </div>

                  <div className="col-12 col-lg-3">
                    <button
                      type="button"
                      className="btn btn-outline-warning w-100"
                      onClick={handleRestoreBackup}
                      disabled={isRestoringBackup || !restoreFile}
                    >
                      {isRestoringBackup ? "Restoring..." : "Restore Settings"}
                    </button>
                  </div>
                </div>
                <p className="small text-muted mb-0 mt-2">
                  Backup files include secret keys, SMTP passwords, and MySQL passwords. Keep them private.
                </p>
              </div>
            </div>

            <div className="card border-danger">
              <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
                <h5 className="mb-1 text-danger">Website Factory Reset</h5>
                <p className="small text-muted mb-0">
                  Reset website data while keeping current users, roles, and permissions.
                </p>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                  <div>
                    <p className="mb-1 fw-semibold">This action permanently removes all website data.</p>
                    <p className="small text-muted mb-0">
                      Bosses, channels, timers, history, presets, notifications, logs, and settings will be reset.
                      Users, roles, and permissions will be preserved.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={showFactoryResetModal}
                    disabled={isResetting}
                  >
                    Factory Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button type="submit" className="btn btn-outline-success me-2" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}

      <div className="card mt-4">
        <div className="card-header fw-bold" style={{ backgroundColor: "#d9dde2" }}>
          <h5 className="mb-1">Send Test Email</h5>
          <p className="small text-muted mb-0">Verify the saved SMTP settings with a test recipient.</p>
        </div>
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-8">
              <label className="form-label" htmlFor="testRecipient">Recipient email</label>
              <input
                id="testRecipient"
                type="email"
                className="form-control"
                value={testRecipient}
                onChange={(event) => setTestRecipient(event.target.value)}
              />
            </div>
            <div className="col-12 col-lg-4">
              <button type="button" className="btn btn-outline-secondary w-100" onClick={handleTestEmail} disabled={isTesting}>
                {isTesting ? "Sending..." : "Send Test"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="factoryResetModal"
        tabIndex="-1"
        aria-labelledby="factoryResetModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5 text-danger" id="factoryResetModalLabel">
                Confirm website factory reset
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                disabled={isResetting}
              ></button>
            </div>
            <div className="modal-body">
              <p>
                This will reset website data and settings, but it will keep users, roles, and permissions. You will be
                logged out after the reset completes.
              </p>
              <label className="form-label" htmlFor="factoryResetConfirm">
                Type RESET to continue
              </label>
              <input
                id="factoryResetConfirm"
                type="text"
                className="form-control"
                value={resetConfirmText}
                onChange={(event) => setResetConfirmText(event.target.value)}
                disabled={isResetting}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isResetting || resetConfirmText !== "RESET"}
                onClick={handleFactoryReset}
              >
                {isResetting ? "Resetting..." : "Reset Website"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;
