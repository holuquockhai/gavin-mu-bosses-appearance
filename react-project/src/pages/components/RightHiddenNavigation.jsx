import { useDispatch, useSelector } from "react-redux";
import { clearNotifications, removeNotification, setNotifications } from "../../js/notificationSlice";
import { useEffect, useMemo, useState } from "react";
import { clearNotificationsApi, getNotificationsApi, removeNotificationApi } from "../../api/notificationApi";
import { Link } from "react-router-dom";
import { USER_API_URL } from "../../api/userApi";
import { formatUserDateTime } from "../../utils/dateTime";

function formatNotificationTime(value) {
    return formatUserDateTime(value, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function resolveAvatarUrl(avatarUrl) {
    if (!avatarUrl) {
        return "";
    }

    return avatarUrl.startsWith("http") ? avatarUrl : `${USER_API_URL}${avatarUrl}`;
}

function NotificationActor({ notification }) {
    const user = notification.user;
    const displayName = user?.fullName || notification.actorName || `User #${notification.userId || "-"}`;
    const avatarUrl = resolveAvatarUrl(user?.avatarUrl);

    if (!notification.userId) {
        return <span className="notification-actor-name">{displayName}</span>;
    }

    return (
        <Link to={`/profile/${notification.userId}`} className="notification-actor-link">
            {avatarUrl ? (
                <img src={avatarUrl} alt="" className="notification-actor-avatar" />
            ) : (
                <span className="notification-actor-avatar notification-actor-avatar-empty" aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                </span>
            )}
            <span className="notification-actor-name">{displayName}</span>
        </Link>
    );
}

function NotificationMessage({ notification }) {
    if (notification.type === "boss-timer-set") {
        return (
            <>
                <NotificationActor notification={notification} /> set timer for <strong>{notification.bossName}</strong> on <strong>{notification.channel}</strong> for {notification.period}.
            </>
        );
    }

    if (notification.type === "boss-created") {
        return (
            <>
                <NotificationActor notification={notification} /> created boss <strong>{notification.bossName}</strong>.
            </>
        );
    }

    if (notification.type === "boss-appeared") {
        return (
            <>
                {notification.actorName ? (
                    <>
                        <NotificationActor notification={notification} /> marked <strong>{notification.bossName}</strong> as appeared on <strong>{notification.channel}</strong>.
                    </>
                ) : (
                    <>
                        <strong>{notification.bossName}</strong> appeared on <strong>{notification.channel}</strong>.
                    </>
                )}
            </>
        );
    }

    if (notification.type === "user-created") {
        return (
            <>
                <NotificationActor notification={notification} /> created user <strong>{notification.userName}</strong>.
            </>
        );
    }

    if (notification.type === "user-deleted") {
        return (
            <>
                <NotificationActor notification={notification} /> deleted user <strong>{notification.userName}</strong>.
            </>
        );
    }

    return notification.message;
}

function RightHiddenNavigation(){
    const dispatch = useDispatch();
    const notifications = useSelector((state) => state.notifications.value);
    const pageSize = useSelector((state) => state.notifications.pageSize);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(notifications.length / pageSize));
    const visibleNotifications = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;

        return notifications.slice(startIndex, startIndex + pageSize);
    }, [currentPage, notifications, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        const syncNotifications = () => {
            getNotificationsApi()
            .then((data) => dispatch(setNotifications(data)))
            .catch(() => {});
        };

        syncNotifications();

    }, [dispatch]);

    const handleRemoveNotification = (notificationId) => {
        removeNotificationApi(notificationId).catch(() => {});
        dispatch(removeNotification(notificationId));
    };

    const handleClearNotifications = () => {
        clearNotificationsApi().catch(() => {});
        dispatch(clearNotifications());
    };

    return (
        <>
            <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasRight"  data-bs-scroll="true" aria-labelledby="offcanvasRightLabel">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasRightLabel">
                        <i className="bi bi-bell" aria-hidden="true"></i>
                        &nbsp; Notifications
                    </h5>
                    <button type="button" className="btn btn-link link-secondary ms-auto" onClick={handleClearNotifications}>Clear All</button>
                    
                    {/* <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button> */}
                </div>
                 <hr className="my-1"/>
                <div className="offcanvas-body">
                    {notifications.length === 0 ? (
                        <p className="small text-muted">No notifications yet.</p>
                    ) : (
                        <>
                            {visibleNotifications.map((notification) => (
                                <div className="alert alert-light alert-dismissible fade show" role="alert" key={notification.id}>
                                    <span className="small d-block"><NotificationMessage notification={notification} /></span>
                                    <span className="small text-muted">{formatNotificationTime(notification.createdAt)}</span>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Close"
                                    onClick={() => handleRemoveNotification(notification.id)}
                                    ></button>
                                </div>
                            ))}

                            <div className="d-flex align-items-center justify-content-between gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((page) => page - 1)}
                                >
                                    Previous
                                </button>
                                <span className="small text-muted">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((page) => page + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default RightHiddenNavigation;
