import { useEffect, useMemo, useRef, useState } from "react";
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
    const [showAllComingSoon, setShowAllComingSoon] = useState(false);
    const [visibleComingSoonCount, setVisibleComingSoonCount] = useState(16);
    const [defaultComingSoonListHeight, setDefaultComingSoonListHeight] = useState(0);
    const comingSoonListRef = useRef(null);

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

    const sortedComingSoonTimers = useMemo(() => {
        return [...timers].sort((firstTimer, secondTimer) => firstTimer.endAt - secondTimer.endAt);
    }, [timers]);
    const comingSoonTimers = showAllComingSoon
        ? sortedComingSoonTimers.slice(0, visibleComingSoonCount)
        : sortedComingSoonTimers.slice(0, 8);
    const hasMoreComingSoonTimers = showAllComingSoon && visibleComingSoonCount < sortedComingSoonTimers.length;

    useEffect(() => {
        setVisibleComingSoonCount(16);
    }, [showAllComingSoon]);

    useEffect(() => {
        if (!showAllComingSoon && comingSoonListRef.current) {
            setDefaultComingSoonListHeight(comingSoonListRef.current.offsetHeight);
        }
    }, [comingSoonTimers.length, showAllComingSoon]);

    const handleComingSoonScroll = (event) => {
        if (!showAllComingSoon || !hasMoreComingSoonTimers) {
            return;
        }

        const element = event.currentTarget;
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

        if (distanceFromBottom < 80) {
            setVisibleComingSoonCount((currentCount) => Math.min(currentCount + 12, sortedComingSoonTimers.length));
        }
    };

    return(
        <>
            <div className="card p-3 rounded-4 unified">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <h5 className="card-title mb-0">
                        Coming Soon Boss {showAllComingSoon ? "(All)" : "(Top 8)"}
                    </h5>
                    {sortedComingSoonTimers.length > 8 && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setShowAllComingSoon((value) => !value)}
                        >
                            {showAllComingSoon ? "Show Top 8" : "Show All"}
                        </button>
                    )}
                </div>
                <div
                    id="soonestList"
                    ref={comingSoonListRef}
                    className={`coming-soon-list d-grid gap-2 ${showAllComingSoon ? "show-all overflow-auto" : ""}`}
                    onScroll={handleComingSoonScroll}
                    tabIndex={showAllComingSoon ? 0 : undefined}
                    style={
                        showAllComingSoon && defaultComingSoonListHeight
                            ? { "--coming-soon-list-height": `${defaultComingSoonListHeight}px` }
                            : undefined
                    }
                >
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
                    {hasMoreComingSoonTimers && (
                        <div className="small text-muted text-center py-2">
                            Scroll to load more bosses
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default LeftContent;
