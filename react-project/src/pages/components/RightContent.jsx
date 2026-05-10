import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getBossHistoryApi } from "../../api/timerApi";
import { USER_API_URL } from "../../api/userApi";

const HISTORY_TOP_LIMIT = 5;
const HISTORY_SHOW_ALL_LIMIT = 10;
const HISTORY_BATCH_LIMIT = 10;

const parseDatabaseDate = (value) => {
    if (!value) {
        return Date.now();
    }

    const valueString = String(value);
    const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(valueString);

    return new Date(hasTimezone ? valueString : `${valueString}Z`).getTime();
};

const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) {
        return null;
    }

    return avatarUrl.startsWith("http") ? avatarUrl : `${USER_API_URL}${avatarUrl}`;
};

const getInitial = (name) => String(name || "?").charAt(0).toUpperCase();

const mapHistory = (history) => ({
    id: `history-${history.id}`,
    dbId: history.id,
    bossId: history.boss_id,
    bossName: history.boss_name,
    channel: history.channel,
    completedAt: parseDatabaseDate(history.completed_at),
    appearedByName: history.appeared_by_name || history.user?.full_name || history.user?.email || "System",
    appearedByType: history.appeared_by_type || (history.user ? "user" : "system"),
    appearedByUser: history.user || null,
});

function formatHistoryTime(value) {
    const date = new Date(value);
    const timeText = new Intl.DateTimeFormat("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
    const dateText = new Intl.DateTimeFormat("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);

    return `${timeText}, ${dateText}`;
}

function formatChannelLabel(channel) {
    if (!channel) {
        return "N/A";
    }

    return String(channel).toLowerCase().startsWith("channel ")
        ? channel
        : `Channel ${channel}`;
}

function RightContent(){
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
    const [defaultHistoryListHeight, setDefaultHistoryListHeight] = useState(0);
    const historyListRef = useRef(null);
    const historyRef = useRef([]);
    const showAllHistoryRef = useRef(false);
    const historyTopHeightRef = useRef(0);
    const hasMoreHistory = showAllHistory && history.length < historyTotal;

    const loadHistory = ({ offset = 0, limit = HISTORY_TOP_LIMIT, append = false, showLoading = true } = {}) => {
        if (append) {
            setIsLoadingMoreHistory(true);
        } else if (showLoading && historyRef.current.length === 0) {
            setIsLoadingHistory(true);
        }

        return getBossHistoryApi({ offset, limit })
            .then((data) => {
                const mappedItems = data.items.map(mapHistory);
                setHistoryTotal(data.total);
                if (data.total <= HISTORY_TOP_LIMIT) {
                    setShowAllHistory(false);
                }
                setHistory((currentHistory) => {
                    const nextHistory = append ? [...currentHistory, ...mappedItems] : mappedItems;
                    historyRef.current = nextHistory;
                    return nextHistory;
                });
            })
            .catch(() => {
                if (!append && historyRef.current.length === 0) {
                    setHistory([]);
                    setHistoryTotal(0);
                }
            })
            .finally(() => {
                if (append) {
                    setIsLoadingMoreHistory(false);
                } else {
                    setIsLoadingHistory(false);
                }
            });
    };

    useEffect(() => {
        showAllHistoryRef.current = showAllHistory;
    }, [showAllHistory]);

    useEffect(() => {
        loadHistory({
            offset: 0,
            limit: showAllHistory ? HISTORY_SHOW_ALL_LIMIT : HISTORY_TOP_LIMIT,
            showLoading: historyRef.current.length === 0,
        });
    }, [showAllHistory]);

    useEffect(() => {
        const handleTimerRefresh = () => {
            loadHistory({
                offset: 0,
                limit: showAllHistoryRef.current ? HISTORY_SHOW_ALL_LIMIT : HISTORY_TOP_LIMIT,
                showLoading: false,
            });
        };

        window.addEventListener("warlords:timer-state-refresh", handleTimerRefresh);
        window.addEventListener("warlords:timer-list-refresh", handleTimerRefresh);

        return () => {
            window.removeEventListener("warlords:timer-state-refresh", handleTimerRefresh);
            window.removeEventListener("warlords:timer-list-refresh", handleTimerRefresh);
        };
    }, []);

    useEffect(() => {
        if (!showAllHistory && historyListRef.current) {
            const nextHeight = historyListRef.current.offsetHeight;
            historyTopHeightRef.current = nextHeight;
            setDefaultHistoryListHeight(nextHeight);
        }
    }, [history.length, showAllHistory]);

    useEffect(() => {
        if (showAllHistory && historyTotal <= HISTORY_TOP_LIMIT) {
            setShowAllHistory(false);
        }
    }, [historyTotal, showAllHistory]);

    const handleHistoryScroll = (event) => {
        if (!showAllHistory || !hasMoreHistory || isLoadingMoreHistory) {
            return;
        }

        const element = event.currentTarget;
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

        if (distanceFromBottom < 80) {
            loadHistory({
                offset: history.length,
                limit: HISTORY_BATCH_LIMIT,
                append: true,
                showLoading: false,
            });
        }
    };

    return(
        <>
            <aside className="side">
                <div className="card p-3 rounded-4 unified">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                        <h5 className="card-title mb-0">
                            Recent Boss History {showAllHistory ? "(All)" : "(last 5)"}
                        </h5>
                        {historyTotal > HISTORY_TOP_LIMIT && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowAllHistory((value) => !value)}
                            >
                                {showAllHistory ? "Show Last 5" : "Show All"}
                            </button>
                        )}
                    </div>
                    <div
                        ref={historyListRef}
                        className={`history-list d-grid gap-2 ${showAllHistory ? "show-all overflow-auto" : ""}`}
                        id="historyList"
                        onScroll={handleHistoryScroll}
                        tabIndex={showAllHistory ? 0 : undefined}
                        style={
                            showAllHistory && (defaultHistoryListHeight || historyTopHeightRef.current)
                                ? { "--history-list-height": `${defaultHistoryListHeight || historyTopHeightRef.current}px` }
                                : undefined
                        }
                    >
                        {isLoadingHistory ? (
                            <div className="boss-loading-box">
                                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                <span>Loading boss history...</span>
                            </div>
                        ) : history.length === 0 ? (
                            <p className="small text-muted mb-0">No completed boss countdowns yet.</p>
                        ) : (
                            history.map((timer) => (
                                <div className="boss-countdown-box boss-history-box ready" key={`${timer.id}-${timer.completedAt}`}>
                                    <div className="boss-countdown-header">
                                        <div className="min-w-0">
                                            <strong className="boss-countdown-name">{timer.bossName}</strong>
                                            <span className="boss-countdown-channel">{formatChannelLabel(timer.channel)}</span>
                                        </div>
                                    </div>
                                    <div className="boss-history-time">
                                        <span>Appeared at {formatHistoryTime(timer.completedAt)} by </span>
                                        {timer.appearedByType === "system" ? (
                                            <span className="fw-semibold">System</span>
                                        ) : timer.appearedByUser?.id ? (
                                            <Link to={`/profile/${timer.appearedByUser.id}`} className="boss-history-user-link">
                                                <span className="boss-history-user-avatar" aria-hidden="true">
                                                    {getAvatarUrl(timer.appearedByUser.avatar_url) ? (
                                                        <img src={getAvatarUrl(timer.appearedByUser.avatar_url)} alt="" />
                                                    ) : (
                                                        <span>{getInitial(timer.appearedByName)}</span>
                                                    )}
                                                </span>
                                                <span>{timer.appearedByName}</span>
                                            </Link>
                                        ) : (
                                            <span className="fw-semibold">{timer.appearedByName}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoadingMoreHistory && (
                            <div className="boss-loading-box compact">
                                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                <span>Loading more history...</span>
                            </div>
                        )}
                        {hasMoreHistory && !isLoadingMoreHistory && (
                            <div className="small text-muted text-center py-2">
                                Scroll to load more history
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

export default RightContent;
