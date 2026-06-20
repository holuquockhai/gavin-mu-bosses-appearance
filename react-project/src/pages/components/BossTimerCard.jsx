import { useDispatch, useSelector } from "react-redux";
import { markBossAsShowed } from '../../js/bossSlice';
import { clearBossCountdown, setBossCountdown } from "../../js/timerSlice";
import { addBossTimerSetNotification } from "../../js/notificationSlice";
import { getUser } from "../../utils/auth";
import { useEffect, useState } from "react";
import { createBossTimerApi, clearBossTimerApi } from "../../api/timerApi";
import { createNotificationApi } from "../../api/notificationApi";
import { showGlobalMessage } from "../../utils/flashMessage";

function formatTimerBadge(endAt) {
    const seconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainSeconds = seconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
}

function BossTimerCard({boss, selectedChannel, isVisible = boss.isShowed, onHide}){
    const dispatch = useDispatch();
    const hoursList = useSelector(state => state.timerHours.value);
    const minuteList = useSelector(state => state.timerMinutes.value);
    const channels = useSelector(state => state.channels.value);
    const timers = useSelector((state) => state.bossCountdowns.value);
    const [selectedHour, setSelectedHour] = useState("0");
    const [selectedMinute, setSelectedMinute] = useState("30");
    const [shouldRender, setShouldRender] = useState(isVisible);
    const selectedChannelTimer = timers.find((timer) => timer.bossId === boss.id && timer.channel === selectedChannel);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            return undefined;
        }

        const timeoutId = window.setTimeout(() => setShouldRender(false), 500);
        return () => window.clearTimeout(timeoutId);
    }, [isVisible]);

    const buildPeriodLabel = () => {
        const hours = Number(selectedHour);
        const minutes = Number(selectedMinute);
        const parts = [];

        if (hours > 0) {
            parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
        }

        if (minutes > 0) {
            parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
        }

        return parts.join(" ") || "0 minutes";
    };

    const handleSetTimer = async () => {
        const totalSeconds = Number(selectedHour) * 3600 + Number(selectedMinute) * 60;

        if (!selectedChannel || totalSeconds <= 0) {
            return;
        }

        const currentUser = getUser();
        const actorName = currentUser?.full_name || currentUser?.email || "Someone";
        const period = buildPeriodLabel();
        const endAt = Date.now() + totalSeconds * 1000;

        await createBossTimerApi({
            boss_id: boss.id,
            boss_name: boss.name,
            channel: selectedChannel,
            hours: Number(selectedHour),
            minutes: Number(selectedMinute),
            end_at: new Date(endAt).toISOString(),
        });

        dispatch(setBossCountdown({
            bossId: boss.id,
            bossName: boss.name,
            channel: selectedChannel,
            hours: selectedHour,
            minutes: selectedMinute,
            endAt,
        }));
        const notificationPayload = {
            actorName,
            bossId: boss.id,
            bossName: boss.name,
            channel: selectedChannel,
            hours: Number(selectedHour),
            minutes: Number(selectedMinute),
            endAt,
            period,
        };
        dispatch(addBossTimerSetNotification(notificationPayload));
        showGlobalMessage({
            message: (
                <>
                    Timer set for <strong>{boss.name}</strong> on <strong>{selectedChannel}</strong> for {period} successfully.
                </>
            ),
        });
        createNotificationApi({
            type: "boss-timer-set",
            payload: notificationPayload,
        }).catch(() => {});
        window.dispatchEvent(new Event("warlords:timer-state-refresh"));
    };

    const handleClearTimer = () => {
        clearBossTimerApi({ bossId: boss.id, channel: selectedChannel }).catch(() => {});
        dispatch(clearBossCountdown({ bossId: boss.id, channel: selectedChannel }));
        setSelectedHour("0");
        setSelectedMinute("0");
        window.dispatchEvent(new Event("warlords:timer-state-refresh"));
    };

    if (!shouldRender) {
        return null;
    }

    return(
        <>
        <div className={`boss-detail ${isVisible ? 'show' : ''}`}>
            <div className="card border-0 shadow-sm unified boss-timer-card">
                <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <div className="boss-card-title-row">
                            <h5 className="card-title mb-0">{boss.name}</h5>
                            <span className={`boss-card-countdown ${selectedChannelTimer ? "" : "is-empty"}`}>
                                {selectedChannelTimer ? formatTimerBadge(selectedChannelTimer.endAt) : "00:00:00"}
                            </span>
                        </div>
                        <span className="small text-muted">{selectedChannel || "No channel selected"}</span>
                    </div>
                    <span className="small text-muted text-end">
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={() => {
                                if (onHide) {
                                    onHide();
                                    return;
                                }

                                dispatch(markBossAsShowed({
                                    bossId: boss.id,
                                    channels: channels.map((channel) => channel.name),
                                }));
                            }}
                        ></button>
                    </span>
                </div>

                <div className="timer-control-grid mt-3">
                    <div>
                        <label className="form-label small text-muted mb-1">Hours</label>
                        <select
                            className="select form-select"
                            value={selectedHour}
                            onChange={(event) => setSelectedHour(event.target.value)}
                        >
                            {hoursList.map(
                                (hour) => (
                                    <option key={hour.value} value={hour.value}>{hour.label}</option>
                                )
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="form-label small text-muted mb-1">Minutes</label>
                        <select
                            className="select form-select"
                            value={selectedMinute}
                            onChange={(event) => setSelectedMinute(event.target.value)}
                        >
                            {minuteList.map(
                                (minute) => (
                                    <option key= {minute.value} value={minute.value}>{minute.label}</option>
                                )
                            )}
                        </select>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                            <button type="button" className="btn btn-outline-secondary" id="applyPresetBtn" onClick={handleSetTimer} disabled={!selectedChannel}>Set</button>
                            <button type="button" className="btn btn-outline-secondary" id="deletePresetBtn" onClick={handleClearTimer} disabled={!selectedChannel}>Clear</button>
                </div>
                </div>
            </div>

            </div>
        </>
        
    );
}

export default BossTimerCard
