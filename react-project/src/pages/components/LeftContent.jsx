import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { completeExpiredCountdowns, markBossAppeared, setBossTimerState } from "../../js/timerSlice";
import { addBossAppearedNotification } from "../../js/notificationSlice";
import { getUser } from "../../utils/auth";
import { getBossTimerStateApi, getComingSoonBossTimersApi, markBossAppearedApi } from "../../api/timerApi";
import { createNotificationApi } from "../../api/notificationApi";
import { playAlertTone } from "../../utils/sound";
import OnlineUsersCard from "./OnlineUsersCard";
import { getApiDateTime } from "../../utils/dateTime";

const COUNTDOWN_TICK_INTERVAL_MS = 1000;
const COMING_SOON_TOP_LIMIT = 8;
const COMING_SOON_SHOW_ALL_LIMIT = 16;
const COMING_SOON_BATCH_LIMIT = 12;

const mapTimer = (timer) => ({
    id: `${timer.channel}-${timer.boss_id}`,
    dbId: timer.id,
    bossId: timer.boss_id,
    bossName: timer.boss_name,
    channel: timer.channel,
    hours: timer.hours,
    minutes: timer.minutes,
    endAt: getApiDateTime(timer.end_at),
});

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
    const [comingSoonTimers, setComingSoonTimers] = useState([]);
    const [comingSoonTotal, setComingSoonTotal] = useState(0);
    const [isLoadingComingSoon, setIsLoadingComingSoon] = useState(true);
    const [isLoadingMoreComingSoon, setIsLoadingMoreComingSoon] = useState(false);
    const [defaultComingSoonListHeight, setDefaultComingSoonListHeight] = useState(0);
    const comingSoonListRef = useRef(null);
    const comingSoonTimersRef = useRef([]);
    const showAllComingSoonRef = useRef(false);
    const comingSoonTopHeightRef = useRef(0);
    const isCompletingExpiredRef = useRef(false);

    const notifyBossAppeared = (timer, actorName, shouldSaveNotification = true) => {
        const payload = {
            actorName,
            bossId: timer.bossId,
            bossName: timer.bossName,
            channel: timer.channel,
        };
        dispatch(addBossAppearedNotification(payload));
        if (shouldSaveNotification) {
            createNotificationApi({
                type: "boss-appeared",
                payload,
            }).catch(() => {});
        }
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
        loadComingSoon({ offset: 0, limit: showAllComingSoon ? COMING_SOON_SHOW_ALL_LIMIT : COMING_SOON_TOP_LIMIT });
    };

    const loadComingSoon = ({ offset = 0, limit = COMING_SOON_TOP_LIMIT, append = false, showLoading = true } = {}) => {
        if (append) {
            setIsLoadingMoreComingSoon(true);
        } else if (showLoading && comingSoonTimersRef.current.length === 0) {
            setIsLoadingComingSoon(true);
        }

        return getComingSoonBossTimersApi({ offset, limit })
            .then((data) => {
                const mappedItems = data.items.map(mapTimer);
                setComingSoonTotal(data.total);
                if (data.total <= COMING_SOON_TOP_LIMIT) {
                    setShowAllComingSoon(false);
                }
                setComingSoonTimers((currentTimers) => {
                    const nextTimers = append ? [...currentTimers, ...mappedItems] : mappedItems;
                    comingSoonTimersRef.current = nextTimers;
                    return nextTimers;
                });
            })
            .catch(() => {
                if (!append && comingSoonTimersRef.current.length === 0) {
                    setComingSoonTimers([]);
                    setComingSoonTotal(0);
                }
            })
            .finally(() => {
                if (append) {
                    setIsLoadingMoreComingSoon(false);
                } else {
                    setIsLoadingComingSoon(false);
                }
            });
    };

    useEffect(() => {
        showAllComingSoonRef.current = showAllComingSoon;
    }, [showAllComingSoon]);

    useEffect(() => {
        const syncTimerState = () => {
            getBossTimerStateApi()
            .then((data) => dispatch(setBossTimerState(data)))
            .catch(() => {});
            loadComingSoon({
                offset: 0,
                limit: showAllComingSoonRef.current ? COMING_SOON_SHOW_ALL_LIMIT : COMING_SOON_TOP_LIMIT,
                showLoading: comingSoonTimersRef.current.length === 0,
            });
        };
        const handleTimerRefresh = () => syncTimerState();

        syncTimerState();
        window.addEventListener("warlords:timer-state-refresh", handleTimerRefresh);
        window.addEventListener("warlords:timer-list-refresh", handleTimerRefresh);

        return () => {
            window.removeEventListener("warlords:timer-state-refresh", handleTimerRefresh);
            window.removeEventListener("warlords:timer-list-refresh", handleTimerRefresh);
        };
    }, [dispatch]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (document.hidden) {
                return;
            }

            const completedAt = Date.now();
            const expiredTimers = timers.filter((timer) => timer.endAt <= completedAt);

            setTick((value) => value + 1);
            if (expiredTimers.length > 0 && !isCompletingExpiredRef.current) {
                isCompletingExpiredRef.current = true;
                dispatch(completeExpiredCountdowns(completedAt));
                window.setTimeout(() => {
                    isCompletingExpiredRef.current = false;
                }, 1000);
            }
        }, COUNTDOWN_TICK_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [dispatch, soundEnabled, soundStyle, timers]);

    const hasMoreComingSoonTimers = showAllComingSoon && comingSoonTimers.length < comingSoonTotal;

    useEffect(() => {
        loadComingSoon({
            offset: 0,
            limit: showAllComingSoon ? COMING_SOON_SHOW_ALL_LIMIT : COMING_SOON_TOP_LIMIT,
            showLoading: comingSoonTimersRef.current.length === 0,
        });
    }, [showAllComingSoon]);

    useEffect(() => {
        if (!showAllComingSoon && comingSoonListRef.current) {
            const nextHeight = comingSoonListRef.current.offsetHeight;
            comingSoonTopHeightRef.current = nextHeight;
            setDefaultComingSoonListHeight(nextHeight);
        }
    }, [comingSoonTimers.length, showAllComingSoon]);

    useEffect(() => {
        if (showAllComingSoon && comingSoonTotal <= COMING_SOON_TOP_LIMIT) {
            setShowAllComingSoon(false);
        }
    }, [comingSoonTotal, showAllComingSoon]);

    const handleComingSoonScroll = (event) => {
        if (!showAllComingSoon || !hasMoreComingSoonTimers || isLoadingMoreComingSoon) {
            return;
        }

        const element = event.currentTarget;
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

        if (distanceFromBottom < 80) {
            loadComingSoon({
                offset: comingSoonTimers.length,
                limit: COMING_SOON_BATCH_LIMIT,
                append: true,
                showLoading: false,
            });
        }
    };

    return(
        <>
            <div className="card p-3 rounded-4 unified">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <h5 className="card-title mb-0">
                        Coming Soon Boss {showAllComingSoon ? "(All)" : "(Top 8)"}
                    </h5>
                    {comingSoonTotal > COMING_SOON_TOP_LIMIT && (
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
                        showAllComingSoon && (defaultComingSoonListHeight || comingSoonTopHeightRef.current)
                            ? { "--coming-soon-list-height": `${defaultComingSoonListHeight || comingSoonTopHeightRef.current}px` }
                            : undefined
                    }
                >
                    {isLoadingComingSoon ? (
                        <div className="boss-loading-box">
                            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                            <span>Loading coming soon bosses...</span>
                        </div>
                    ) : comingSoonTimers.length === 0 ? (
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
                    {isLoadingMoreComingSoon && (
                        <div className="boss-loading-box compact">
                            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                            <span>Loading more bosses...</span>
                        </div>
                    )}
                    {hasMoreComingSoonTimers && !isLoadingMoreComingSoon && (
                        <div className="small text-muted text-center py-2">
                            Scroll to load more bosses
                        </div>
                    )}
                </div>
            </div>

            <OnlineUsersCard className="mt-3" />
        </>
    )
}

export default LeftContent;
