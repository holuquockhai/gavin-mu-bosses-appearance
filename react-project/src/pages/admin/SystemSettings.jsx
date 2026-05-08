import { useEffect, useState } from "react";
import {
  getSystemSettingsApi,
  sendSystemSettingsTestEmailApi,
  updateBrandingSettingsApi,
  updateSystemSettingsApi,
} from "../../api/systemSettingsApi";
import { USER_API_URL } from "../../api/userApi";

const initialForm = {
  app_secret_key: "",
  app_base_url: "http://127.0.0.1:5173",
  site_logo_url: "",
  site_sublogo_url: "",
  site_head_title: "MU BOSS TIMER",
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
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const nullableFields = [
        "app_secret_key",
        "app_base_url",
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
          site_head_title: payload.site_head_title || "MU BOSS TIMER",
          ...brandingFiles,
        });
        savedSettings = {
          ...savedSettings,
          ...savedBranding,
        };
        setBrandingFiles({ site_logo: null, site_sublogo: null });
      }

      setForm({
        ...initialForm,
        ...savedSettings,
        smtp_password: "",
        mysql_password: "",
      });
      setSmtpPasswordConfigured(Boolean(savedSettings.smtp_password_configured));
      setMysqlPasswordConfigured(Boolean(savedSettings.mysql_password_configured));
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
                <p className="small text-muted mb-0">Core application URLs and token secret.</p>
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
    </div>
  );
}

export default SystemSettings;
