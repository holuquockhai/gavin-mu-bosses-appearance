import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

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
    const history = useSelector((state) => state.bossCountdowns.history);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [visibleHistoryCount, setVisibleHistoryCount] = useState(10);
    const [defaultHistoryListHeight, setDefaultHistoryListHeight] = useState(0);
    const historyListRef = useRef(null);
    const visibleHistory = showAllHistory
        ? history.slice(0, visibleHistoryCount)
        : history.slice(0, 5);
    const hasMoreHistory = showAllHistory && visibleHistoryCount < history.length;

    useEffect(() => {
        setVisibleHistoryCount(10);
    }, [showAllHistory]);

    useEffect(() => {
        if (!showAllHistory && historyListRef.current) {
            setDefaultHistoryListHeight(historyListRef.current.offsetHeight);
        }
    }, [visibleHistory.length, showAllHistory]);

    const handleHistoryScroll = (event) => {
        if (!showAllHistory || !hasMoreHistory) {
            return;
        }

        const element = event.currentTarget;
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

        if (distanceFromBottom < 80) {
            setVisibleHistoryCount((currentCount) => Math.min(currentCount + 10, history.length));
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
                        {history.length > 5 && (
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
                            showAllHistory && defaultHistoryListHeight
                                ? { "--history-list-height": `${defaultHistoryListHeight}px` }
                                : undefined
                        }
                    >
                        {history.length === 0 ? (
                            <p className="small text-muted mb-0">No completed boss countdowns yet.</p>
                        ) : (
                            visibleHistory.map((timer) => (
                                <div className="boss-history-box" key={`${timer.id}-${timer.completedAt}`}>
                                    <div>
                                        <strong>{timer.bossName}</strong>
                                        <span className="small text-muted d-block">{formatChannelLabel(timer.channel)}</span>
                                    </div>
                                    <span className="small">Appeared at {formatHistoryTime(timer.completedAt)}</span>
                                </div>
                            ))
                        )}
                        {hasMoreHistory && (
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
