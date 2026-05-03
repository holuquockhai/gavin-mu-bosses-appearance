import { useDispatch, useSelector } from "react-redux";
import { clearNotifications, removeNotification, setNotifications } from "../../js/notificationSlice";
import { useEffect, useMemo, useState } from "react";
import { clearNotificationsApi, getNotificationsApi, removeNotificationApi } from "../../api/notificationApi";

function formatNotificationTime(value) {
    return new Intl.DateTimeFormat("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function NotificationMessage({ notification }) {
    if (notification.type === "boss-timer-set") {
        return (
            <>
                {notification.actorName} set timer for <strong>{notification.bossName}</strong> on <strong>{notification.channel}</strong> for {notification.period}.
            </>
        );
    }

    if (notification.type === "boss-created") {
        return (
            <>
                {notification.actorName} created boss <strong>{notification.bossName}</strong>.
            </>
        );
    }

    if (notification.type === "boss-appeared") {
        return (
            <>
                {notification.actorName ? (
                    <>
                        {notification.actorName} marked <strong>{notification.bossName}</strong> as appeared on <strong>{notification.channel}</strong>.
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
                {notification.actorName} created user <strong>{notification.userName}</strong>.
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
        const intervalId = setInterval(syncNotifications, 5000);

        return () => clearInterval(intervalId);
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16">
  <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"></path>
</svg>
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
