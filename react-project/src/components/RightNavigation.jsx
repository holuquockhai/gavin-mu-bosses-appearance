function RightNavigation(){
    return(
        <>
            <aside className="side">
                <div className="card">
                    <h2>Recent Boss History (last 5)</h2>
                    <div className="history-list" id="historyList"></div>
                </div>
            </aside>
        </>
    );
}

export default RightNavigation