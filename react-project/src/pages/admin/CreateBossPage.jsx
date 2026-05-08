import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Modal } from "bootstrap";
import CreateBossModal from "./components/CreateBossModal";
import ListBossTable from "./components/ListBossTable";
import { addBossCreatedNotification } from "../../js/notificationSlice";
import { getUser } from "../../utils/auth";
import { createNotificationApi } from "../../api/notificationApi";

export default function CreateBossPage() {
  const dispatch = useDispatch();
  const [bossListVersion, setBossListVersion] = useState(0);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setNotification(null);
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [notification]);

  const handleBossCreated = (boss) => {
    const currentUser = getUser();
    const actorName = currentUser?.full_name || currentUser?.email || "Someone";

    setBossListVersion((currentVersion) => currentVersion + 1);
    setNotification({
      id: Date.now(),
      message: `Boss created successfully: ${boss.name}`,
    });
    const notificationPayload = { actorName, bossName: boss.name };
    dispatch(addBossCreatedNotification(notificationPayload));
    createNotificationApi({
      type: "boss-created",
      payload: notificationPayload,
    }).catch(() => {});
  };

  const handleBossDeleted = (boss) => {
    setBossListVersion((currentVersion) => currentVersion + 1);
    setNotification({
      id: Date.now(),
      message: (
        <>
          <strong>{boss.name}</strong> has been successfully deleted!
        </>
      ),
    });
  };

  const handleBossUpdated = (boss) => {
    setBossListVersion((currentVersion) => currentVersion + 1);
    setNotification({
      id: Date.now(),
      message: `Boss updated successfully: ${boss.name}`,
    });
  };

  const openCreateModal = () => {
    const modalElement = document.getElementById("createBossModal");
    Modal.getOrCreateInstance(modalElement).show();
  };

  return (
    <div className="p-3 card rounded-4 unified">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h4 className="mb-0">Bosses Management</h4>
        <button type="button" className="btn btn-outline-success me-2" onClick={openCreateModal}>
          + Create Boss
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

      <CreateBossModal onCreated={handleBossCreated} />

      <ListBossTable
        refreshKey={bossListVersion}
        onDeleted={handleBossDeleted}
        onUpdated={handleBossUpdated}
      />
    </div>
  );
}
