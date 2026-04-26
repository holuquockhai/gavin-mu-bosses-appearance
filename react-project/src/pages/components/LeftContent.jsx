import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { completeExpiredCountdowns, markBossAppeared, setBossTimerState } from "../../js/timerSlice";
import { addBossAppearedNotification } from "../../js/notificationSlice";
import { getUser } from "../../utils/auth";
import { completeExpiredBossTimersApi, getBossTimerStateApi, markBossAppearedApi } from "../../api/timerApi";
import { createNotificationApi } from "../../api/notificationApi";
import { playAlertTone } from "../../utils/sound";

function formatRemaining(endAt) {
    const seconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainSeconds = seconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
}

function formatChannelLabel(channel) {
    if (!channel) {
        return "N/A";
    }

    return String(channel).toLowerCase().startsWith("channel ")
        ? channel
        : `Channel ${channel}`;
}

function LeftContent(){
    const dispatch = useDispatch();
    const timers = useSelector((state) => state.bossCountdowns.value);
    const soundEnabled = useSelector((state) => state.systemSettings.soundEnabled);
    const soundStyle = useSelector((state) => state.systemSettings.soundStyle);
    const [, setTick] = useState(0);

    const notifyBossAppeared = (timer, actorName) => {
        const payload = {
            actorName,
            bossName: timer.bossName,
            channel: timer.channel,
        };
        dispatch(addBossAppearedNotification(payload));
        createNotificationApi({
            type: "boss-appeared",
            payload,
        }).catch(() => {});
        if (soundEnabled) {
            playAlertTone(soundStyle);
        }
    };

    const handleBossAppeared = async (timer) => {
        const currentUser = getUser();
        const actorName = currentUser?.full_name || currentUser?.email || "Someone";
        const completedAt = Date.now();

        await markBossAppearedApi({
            boss_id: timer.bossId,
            channel: timer.channel,
            completed_at: new Date(completedAt).toISOString(),
        });
        notifyBossAppeared(timer, actorName);
        dispatch(markBossAppeared({
            bossId: timer.bossId,
            channel: timer.channel,
            completedAt,
        }));
    };

    useEffect(() => {
        const syncTimerState = () => {
            getBossTimerStateApi()
            .then((data) => dispatch(setBossTimerState(data)))
            .catch(() => {});
        };
        syncTimerState();
        const syncIntervalId = setInterval(syncTimerState, 3000);

        return () => clearInterval(syncIntervalId);
    }, [dispatch]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const completedAt = Date.now();
            const expiredTimers = timers.filter((timer) => timer.endAt <= completedAt);

            expiredTimers.forEach((timer) => notifyBossAppeared(timer));
            setTick((value) => value + 1);
            dispatch(completeExpiredCountdowns(completedAt));
            if (expiredTimers.length > 0) {
                completeExpiredBossTimersApi().catch(() => {});
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [dispatch, timers]);

    const comingSoonTimers = useMemo(() => {
        return [...timers].sort((firstTimer, secondTimer) => firstTimer.endAt - secondTimer.endAt).slice(0, 8);
    }, [timers]);

    return(
        <>
            <div className="card p-3 rounded-4 unified">
                <h5 className="card-title">Coming Soon Boss (Top 8)</h5>
                <div id="soonestList" className="d-grid gap-2">
                    {comingSoonTimers.length === 0 ? (
                        <p className="small text-muted mb-0">Set a boss timer to show countdown here.</p>
                    ) : (
                        comingSoonTimers.map((timer) => {
                            const isReady = timer.endAt <= Date.now();

                            return (
                                <div className={`boss-countdown-box ${isReady ? "ready" : ""}`} key={timer.id}>
                                    <div className="boss-countdown-header">
                                        <div className="min-w-0">
                                            <strong className="boss-countdown-name">{timer.bossName}</strong>
                                            <span className="boss-countdown-channel">
                                                {formatChannelLabel(timer.channel)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-outline-success countdown-action"
                                            onClick={() => handleBossAppeared(timer)}
                                        >
                                            Mark As Appeared
                                        </button>
                                    </div>
                                    <div className={`countdown-time ${isReady ? "text-success" : ""}`}>
                                        {isReady ? "Appeared" : formatRemaining(timer.endAt)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    )
}

export default LeftContent;
