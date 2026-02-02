function RightNavigation(){
    return(
        <>
            <aside className="side">
                <div className="card p-3 rounded-4">
                    <h5 className="card-title">Recent Boss History (last 5)</h5>
                    <div className="history-list" id="historyList"></div>
                </div>
            </aside>
        </>
    );
}

export default RightNavigation