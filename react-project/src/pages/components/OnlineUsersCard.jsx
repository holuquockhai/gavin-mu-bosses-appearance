import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { USER_API_URL } from "../../api/userApi";

const INACTIVE_AFTER_MS = 3 * 60 * 1000;

function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) {
    return null;
  }

  return avatarUrl.startsWith("http") ? avatarUrl : `${USER_API_URL}${avatarUrl}`;
}

function getLastActiveAt(user) {
  const value = user.last_active_at || user.lastActiveAt || user.last_activity_at;
  const timestamp = value ? Date.parse(value) : NaN;

  return Number.isNaN(timestamp) ? Date.now() : timestamp;
}

function OnlineUsersCard({ className = "" }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const handleOnlineUsersUpdated = (event) => {
      setOnlineUsers(Array.isArray(event.detail) ? event.detail : []);
    };

    window.addEventListener("warlords:online-users-updated", handleOnlineUsersUpdated);
    return () => window.removeEventListener("warlords:online-users-updated", handleOnlineUsersUpdated);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className={`card p-3 rounded-4 unified online-users-card ${className}`}>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <h5 className="card-title mb-0">Online Users</h5>
        <span className="badge text-bg-success">{onlineUsers.length}</span>
      </div>

      <div className="online-users-list d-grid gap-2">
        {onlineUsers.length === 0 ? (
          <p className="small text-muted mb-0">No users online.</p>
        ) : (
          onlineUsers.map((user) => {
            const displayName = user.full_name || user.email;
            const avatarUrl = getAvatarUrl(user.avatar_url);
            const isActive = now - getLastActiveAt(user) < INACTIVE_AFTER_MS;
            const statusText = isActive ? "Online" : "Inactive";

            return (
              <div className="online-user-item" key={user.id}>
                <Link to={`/profile/${user.id}`} className="online-user-profile-link">
                  <div className="online-user-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} />
                    ) : (
                      <span>{String(displayName || "?").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="online-user-name">{displayName}</div>
                    <div className={`online-user-status ${isActive ? "is-active" : "is-inactive"}`}>
                      {statusText}
                    </div>
                  </div>
                </Link>
                <span
                  className={`online-user-dot ${isActive ? "is-active" : "is-inactive"}`}
                  aria-label={statusText}
                  title={statusText}
                ></span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OnlineUsersCard;
