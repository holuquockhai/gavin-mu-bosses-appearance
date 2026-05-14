import { useEffect, useMemo, useState } from "react";
import {
  getActivityLogsApi,
  getCronJobLogsApi,
  getEmailLogsApi,
  getLogFilterOptionsApi,
  getSystemSettingLogsApi,
  sendEmailLogNowApi,
} from "../../api/logApi";
import AdminPagination from "./components/AdminPagination";
import { formatUserDateTime } from "../../utils/dateTime";
import { showGlobalMessage } from "../../utils/flashMessage";

const pageSize = 25;

const initialActivityFilters = {
  search: "",
  event_type: "",
  user: "",
  entity_type: "",
  date_from: "",
  date_to: "",
};

const initialSystemSettingFilters = {
  search: "",
  event_type: "",
  user: "",
  date_from: "",
  date_to: "",
};

const initialEmailFilters = {
  search: "",
  email_type: "",
  status: "",
  date_from: "",
  date_to: "",
};

const initialCronFilters = {
  search: "",
  job_name: "",
  status: "",
  date_from: "",
  date_to: "",
};

const formatDateTime = (value) => {
  return formatUserDateTime(value) || "-";
};

const statusClass = {
  pending: "text-bg-warning",
  sending: "text-bg-info",
  sent: "text-bg-success",
  failed: "text-bg-danger",
  running: "text-bg-info",
  success: "text-bg-success",
};

const parseActivityDetails = (details) => {
  if (!details) {
    return null;
  }

  try {
    return JSON.parse(details);
  } catch {
    return details;
  }
};

const renderDetails = (details) => {
  const parsedDetails = parseActivityDetails(details);
  const values = parsedDetails?.values || parsedDetails;

  if (!values || typeof values !== "object") {
    return <span className="small text-muted">{values || "-"}</span>;
  }

  return (
    <div className="small log-details-list">
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="d-flex gap-2">
          <span className="text-muted text-nowrap">{key}:</span>
          <span className="text-break">{String(value ?? "")}</span>
        </div>
      ))}
    </div>
  );
};

function Logs() {
  const [activeTab, setActiveTab] = useState("activities");
  const [activityPage, setActivityPage] = useState(1);
  const [systemSettingPage, setSystemSettingPage] = useState(1);
  const [emailPage, setEmailPage] = useState(1);
  const [cronPage, setCronPage] = useState(1);
  const [activities, setActivities] = useState({ items: [], total: 0, page: 1, page_size: pageSize });
  const [systemSettings, setSystemSettings] = useState({ items: [], total: 0, page: 1, page_size: pageSize });
  const [emails, setEmails] = useState({ items: [], total: 0, page: 1, page_size: pageSize });
  const [cronJobs, setCronJobs] = useState({ items: [], total: 0, page: 1, page_size: pageSize });
  const [activityFilters, setActivityFilters] = useState(initialActivityFilters);
  const [systemSettingFilters, setSystemSettingFilters] = useState(initialSystemSettingFilters);
  const [emailFilters, setEmailFilters] = useState(initialEmailFilters);
  const [cronFilters, setCronFilters] = useState(initialCronFilters);
  const [filterOptions, setFilterOptions] = useState({
    activity_event_types: [],
    activity_entity_types: [],
    system_setting_event_types: [],
    email_types: [],
    email_statuses: [],
    cron_job_names: [],
    cron_statuses: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [error, setError] = useState("");

  const activityTotalPages = useMemo(() => Math.max(1, Math.ceil(activities.total / pageSize)), [activities.total]);
  const systemSettingTotalPages = useMemo(() => Math.max(1, Math.ceil(systemSettings.total / pageSize)), [systemSettings.total]);
  const emailTotalPages = useMemo(() => Math.max(1, Math.ceil(emails.total / pageSize)), [emails.total]);
  const cronTotalPages = useMemo(() => Math.max(1, Math.ceil(cronJobs.total / pageSize)), [cronJobs.total]);

  useEffect(() => {
    getLogFilterOptionsApi()
      .then((data) => setFilterOptions((currentOptions) => ({ ...currentOptions, ...data })))
      .catch(() => {});
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getActivityLogsApi({ page: activityPage, pageSize, filters: activityFilters });
      setActivities(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemSettings = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getSystemSettingLogsApi({ page: systemSettingPage, pageSize, filters: systemSettingFilters });
      setSystemSettings(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load system setting logs");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmails = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getEmailLogsApi({ page: emailPage, pageSize, filters: emailFilters });
      setEmails(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load email logs");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCronJobs = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getCronJobLogsApi({ page: cronPage, pageSize, filters: cronFilters });
      setCronJobs(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load cronjob logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "activities") {
      loadActivities();
    } else if (activeTab === "system-settings") {
      loadSystemSettings();
    } else if (activeTab === "emails") {
      loadEmails();
    } else {
      loadCronJobs();
    }
  }, [
    activeTab,
    activityPage,
    systemSettingPage,
    emailPage,
    cronPage,
    activityFilters,
    systemSettingFilters,
    emailFilters,
    cronFilters,
  ]);

  useEffect(() => {
    let refreshTimerId;

    const handleLogsUpdated = (event) => {
      const message = event.detail || {};
      const shouldRefreshActivities = activeTab === "activities" && message.type === "logs_updated" && message.scope !== "system-settings";
      const shouldRefreshSystemSettings = activeTab === "system-settings" && message.type === "logs_updated" && message.scope === "system-settings";
      const shouldRefreshEmails = activeTab === "emails" && message.type === "email_logs_updated";
      const shouldRefreshCronJobs = activeTab === "cronjobs" && message.type === "cron_logs_updated";

      if (!shouldRefreshActivities && !shouldRefreshSystemSettings && !shouldRefreshEmails && !shouldRefreshCronJobs) {
        return;
      }

      window.clearTimeout(refreshTimerId);
      refreshTimerId = window.setTimeout(() => {
        if (shouldRefreshActivities) {
          loadActivities();
        } else if (shouldRefreshSystemSettings) {
          loadSystemSettings();
        } else if (shouldRefreshEmails) {
          loadEmails();
        } else if (shouldRefreshCronJobs) {
          loadCronJobs();
        }
      }, 150);
    };

    window.addEventListener("warlords:logs-updated", handleLogsUpdated);

    return () => {
      window.clearTimeout(refreshTimerId);
      window.removeEventListener("warlords:logs-updated", handleLogsUpdated);
    };
  }, [activeTab, activityPage, systemSettingPage, emailPage, cronPage, activityFilters, systemSettingFilters, emailFilters, cronFilters]);

  const updateFilters = (setter, setPage) => (event) => {
    const { name, value } = event.target;
    setter((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
    setPage(1);
  };

  const resetFilters = (setter, initialFilters, setPage) => {
    setter(initialFilters);
    setPage(1);
  };

  const handleSendNow = async (emailId) => {
    setSendingId(emailId);
    setError("");

    try {
      await sendEmailLogNowApi(emailId);
      showGlobalMessage({ message: "Email send job has been processed." });
      await loadEmails();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="p-3 card rounded-4 unified">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3">
        <div>
          <h4 className="mb-1">Logs</h4>
          <p className="small text-muted mb-0">Review website activity and queued email delivery.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-pills gap-2 mb-3">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "activities" ? "active" : ""}`}
            onClick={() => setActiveTab("activities")}
          >
            <i className="bi bi-activity me-2" aria-hidden="true"></i>
            Activities
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "system-settings" ? "active" : ""}`}
            onClick={() => setActiveTab("system-settings")}
          >
            <i className="bi bi-sliders me-2" aria-hidden="true"></i>
            System Setting Logs
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "emails" ? "active" : ""}`}
            onClick={() => setActiveTab("emails")}
          >
            <i className="bi bi-envelope-paper me-2" aria-hidden="true"></i>
            Email Logs
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "cronjobs" ? "active" : ""}`}
            onClick={() => setActiveTab("cronjobs")}
          >
            <i className="bi bi-clock-history me-2" aria-hidden="true"></i>
            Cronjob Logs
          </button>
        </li>
      </ul>

      {activeTab === "activities" && (
        <ActivityLogFilters
          title="Filter Activities"
          filters={activityFilters}
          onChange={updateFilters(setActivityFilters, setActivityPage)}
          onReset={() => resetFilters(setActivityFilters, initialActivityFilters, setActivityPage)}
          eventOptions={filterOptions.activity_event_types}
          entityOptions={filterOptions.activity_entity_types}
          showEntity
        />
      )}

      {activeTab === "system-settings" && (
        <ActivityLogFilters
          title="Filter System Setting Logs"
          filters={systemSettingFilters}
          onChange={updateFilters(setSystemSettingFilters, setSystemSettingPage)}
          onReset={() => resetFilters(setSystemSettingFilters, initialSystemSettingFilters, setSystemSettingPage)}
          eventOptions={filterOptions.system_setting_event_types}
        />
      )}

      {activeTab === "emails" && (
        <EmailLogFilters
          filters={emailFilters}
          onChange={updateFilters(setEmailFilters, setEmailPage)}
          onReset={() => resetFilters(setEmailFilters, initialEmailFilters, setEmailPage)}
          typeOptions={filterOptions.email_types}
          statusOptions={filterOptions.email_statuses}
        />
      )}

      {activeTab === "cronjobs" && (
        <CronJobLogFilters
          filters={cronFilters}
          onChange={updateFilters(setCronFilters, setCronPage)}
          onReset={() => resetFilters(setCronFilters, initialCronFilters, setCronPage)}
          jobOptions={filterOptions.cron_job_names}
          statusOptions={filterOptions.cron_statuses}
        />
      )}

      {isLoading ? (
        <p className="small text-muted mb-0">Loading logs...</p>
      ) : activeTab === "activities" ? (
        <ActivityLogTable
          items={activities.items}
          emptyMessage="No activity logs yet."
          page={activityPage}
          totalPages={activityTotalPages}
          onPageChange={setActivityPage}
        />
      ) : activeTab === "system-settings" ? (
        <ActivityLogTable
          items={systemSettings.items}
          emptyMessage="No system setting logs yet."
          page={systemSettingPage}
          totalPages={systemSettingTotalPages}
          onPageChange={setSystemSettingPage}
        />
      ) : activeTab === "emails" ? (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Created</th>
                  <th>Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emails.items.map((item) => (
                  <tr key={item.id}>
                    <td><span className="badge text-bg-secondary">{item.email_type}</span></td>
                    <td>{item.recipient}</td>
                    <td>
                      <div>{item.subject}</div>
                      {item.last_error && <div className="small text-danger">{item.last_error}</div>}
                    </td>
                    <td><span className={`badge ${statusClass[item.status] || "text-bg-secondary"}`}>{item.status}</span></td>
                    <td>{item.attempts}</td>
                    <td>{formatDateTime(item.created_at)}</td>
                    <td>{formatDateTime(item.sent_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleSendNow(item.id)}
                        disabled={sendingId === item.id || item.status === "sent"}
                      >
                        {item.status === "sent" ? "Sent" : sendingId === item.id ? "Sending..." : "Send now"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!emails.items.length && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">No email logs yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination page={emailPage} totalPages={emailTotalPages} onPageChange={setEmailPage} />
        </>
      ) : (
        <CronJobLogTable
          items={cronJobs.items}
          page={cronPage}
          totalPages={cronTotalPages}
          onPageChange={setCronPage}
        />
      )}
    </div>
  );
}

function ActivityLogFilters({ title, filters, onChange, onReset, eventOptions = [], entityOptions = [], showEntity = false }) {
  return (
    <form className="border rounded-3 p-3 mb-3 bg-body-tertiary" onSubmit={(event) => event.preventDefault()}>
      <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h6 className="mb-0">{title}</h6>
      </div>
      <div className="row g-3 align-items-end">
        <div className="col-12 col-lg-3">
          <label className="form-label small text-muted" htmlFor={`${title}-search`}>Search</label>
          <input
            id={`${title}-search`}
            type="search"
            name="search"
            className="form-control"
            placeholder="Description or details..."
            value={filters.search}
            onChange={onChange}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-2">
          <label className="form-label small text-muted" htmlFor={`${title}-event`}>Event</label>
          <select
            id={`${title}-event`}
            name="event_type"
            className="form-select"
            value={filters.event_type}
            onChange={onChange}
          >
            <option value="">All events</option>
            {eventOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-2">
          <label className="form-label small text-muted" htmlFor={`${title}-user`}>User</label>
          <input
            id={`${title}-user`}
            type="search"
            name="user"
            className="form-control"
            placeholder="Name or email"
            value={filters.user}
            onChange={onChange}
          />
        </div>
        {showEntity && (
          <div className="col-12 col-sm-6 col-lg-2">
            <label className="form-label small text-muted" htmlFor={`${title}-entity`}>Entity</label>
            <select
              id={`${title}-entity`}
              name="entity_type"
              className="form-select"
              value={filters.entity_type}
              onChange={onChange}
            >
              <option value="">All entities</option>
              {entityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}
        <DateFilters filters={filters} onChange={onChange} />
        <div className="col-12 col-lg-1">
          <button type="button" className="btn btn-outline-secondary w-100" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}

function EmailLogFilters({ filters, onChange, onReset, typeOptions = [], statusOptions = [] }) {
  const selectableStatuses = statusOptions.length ? statusOptions : ["pending", "sending", "sent", "failed"];

  return (
    <form className="border rounded-3 p-3 mb-3 bg-body-tertiary" onSubmit={(event) => event.preventDefault()}>
      <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h6 className="mb-0">Filter Email Logs</h6>
      </div>
      <div className="row g-3 align-items-end">
        <div className="col-12 col-lg-3">
          <label className="form-label small text-muted" htmlFor="emailLogSearch">Search</label>
          <input
            id="emailLogSearch"
            type="search"
            name="search"
            className="form-control"
            placeholder="Recipient, subject, error..."
            value={filters.search}
            onChange={onChange}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-2">
          <label className="form-label small text-muted" htmlFor="emailLogType">Type</label>
          <select
            id="emailLogType"
            name="email_type"
            className="form-select"
            value={filters.email_type}
            onChange={onChange}
          >
            <option value="">All types</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-2">
          <label className="form-label small text-muted" htmlFor="emailLogStatus">Status</label>
          <select
            id="emailLogStatus"
            name="status"
            className="form-select"
            value={filters.status}
            onChange={onChange}
          >
            <option value="">All statuses</option>
            {selectableStatuses.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <DateFilters filters={filters} onChange={onChange} />
        <div className="col-12 col-lg-1">
          <button type="button" className="btn btn-outline-secondary w-100" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}

function CronJobLogFilters({ filters, onChange, onReset, jobOptions = [], statusOptions = [] }) {
  const selectableStatuses = statusOptions.length ? statusOptions : ["running", "success", "failed"];

  return (
    <form className="border rounded-3 p-3 mb-3 bg-body-tertiary" onSubmit={(event) => event.preventDefault()}>
      <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h6 className="mb-0">Filter Cronjob Logs</h6>
      </div>
      <div className="row g-3 align-items-end">
        <div className="col-12 col-lg-3">
          <label className="form-label small text-muted" htmlFor="cronLogSearch">Search</label>
          <input
            id="cronLogSearch"
            type="search"
            name="search"
            className="form-control"
            placeholder="Message or error..."
            value={filters.search}
            onChange={onChange}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-2">
          <label className="form-label small text-muted" htmlFor="cronLogJob">Job</label>
          <select
            id="cronLogJob"
            name="job_name"
            className="form-select"
            value={filters.job_name}
            onChange={onChange}
          >
            <option value="">All jobs</option>
            {jobOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-2">
          <label className="form-label small text-muted" htmlFor="cronLogStatus">Status</label>
          <select
            id="cronLogStatus"
            name="status"
            className="form-select"
            value={filters.status}
            onChange={onChange}
          >
            <option value="">All statuses</option>
            {selectableStatuses.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <DateFilters filters={filters} onChange={onChange} />
        <div className="col-12 col-lg-1">
          <button type="button" className="btn btn-outline-secondary w-100" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}

function DateFilters({ filters, onChange }) {
  return (
    <>
      <div className="col-12 col-sm-6 col-lg-2">
        <label className="form-label small text-muted" htmlFor={`dateFrom-${Object.keys(filters).join("-")}`}>From</label>
        <input
          id={`dateFrom-${Object.keys(filters).join("-")}`}
          type="date"
          name="date_from"
          className="form-control"
          value={filters.date_from}
          onChange={onChange}
        />
      </div>
      <div className="col-12 col-sm-6 col-lg-2">
        <label className="form-label small text-muted" htmlFor={`dateTo-${Object.keys(filters).join("-")}`}>To</label>
        <input
          id={`dateTo-${Object.keys(filters).join("-")}`}
          type="date"
          name="date_to"
          className="form-control"
          value={filters.date_to}
          onChange={onChange}
        />
      </div>
    </>
  );
}

function CronJobLogTable({ items, page, totalPages, onPageChange }) {
  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Job</th>
              <th>Status</th>
              <th>Processed</th>
              <th>Message</th>
              <th>Started</th>
              <th>Finished</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.job_name}</td>
                <td><span className={`badge ${statusClass[item.status] || "text-bg-secondary"}`}>{item.status}</span></td>
                <td>{item.processed_count}</td>
                <td>
                  <div>{item.message || "-"}</div>
                  {item.error && <div className="small text-danger">{item.error}</div>}
                </td>
                <td>{formatDateTime(item.started_at)}</td>
                <td>{formatDateTime(item.finished_at)}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">No cronjob logs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  );
}

function ActivityLogTable({ items, emptyMessage, page, totalPages, onPageChange }) {
  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Event</th>
              <th>Description</th>
              <th>Details</th>
              <th>User</th>
              <th>Entity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><span className="badge text-bg-secondary">{item.event_type}</span></td>
                <td>{item.description}</td>
                <td>{renderDetails(item.details)}</td>
                <td>
                  <div className="fw-semibold">{item.user_full_name || "System"}</div>
                  {item.user_email && <div className="small text-muted">{item.user_email}</div>}
                </td>
                <td>{item.entity_type ? `${item.entity_type} #${item.entity_id || "-"}` : "-"}</td>
                <td>{formatDateTime(item.created_at)}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  );
}

export default Logs;
