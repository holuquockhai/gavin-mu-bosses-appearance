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

    return(
        <>
            <aside className="side">
                <div className="card p-3 rounded-4 unified">
                    <h5 className="card-title">Recent Boss History (last 5)</h5>
                    <div className="history-list d-grid gap-2" id="historyList">
                        {history.length === 0 ? (
                            <p className="small text-muted mb-0">No completed boss countdowns yet.</p>
                        ) : (
                            history.map((timer) => (
                                <div className="boss-history-box" key={`${timer.id}-${timer.completedAt}`}>
                                    <div>
                                        <strong>{timer.bossName}</strong>
                                        <span className="small text-muted d-block">{formatChannelLabel(timer.channel)}</span>
                                    </div>
                                    <span className="small">Appeared at {formatHistoryTime(timer.completedAt)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

export default RightContent;
