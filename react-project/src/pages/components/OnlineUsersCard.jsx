import { useEffect, useState } from "react";
import { USER_API_URL } from "../../api/userApi";

function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) {
    return null;
  }

  return avatarUrl.startsWith("http") ? avatarUrl : `${USER_API_URL}${avatarUrl}`;
}

function OnlineUsersCard({ className = "" }) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const handleOnlineUsersUpdated = (event) => {
      setOnlineUsers(Array.isArray(event.detail) ? event.detail : []);
    };

    window.addEventListener("warlords:online-users-updated", handleOnlineUsersUpdated);
    return () => window.removeEventListener("warlords:online-users-updated", handleOnlineUsersUpdated);
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

            return (
              <div className="online-user-item" key={user.id}>
                <div className="online-user-avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} />
                  ) : (
                    <span>{String(displayName || "?").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="online-user-name">{displayName}</div>
                  {user.full_name && <div className="online-user-email">{user.email}</div>}
                </div>
                <span className="online-user-dot" aria-label="Online"></span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OnlineUsersCard;
