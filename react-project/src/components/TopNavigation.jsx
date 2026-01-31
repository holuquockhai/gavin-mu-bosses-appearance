function TopNavigation(){
    return(
        <>
            <div className="top-right">
                <button className="btn" id="resetAllBtn" title="Clear all timers in all channels">Reset All</button>
                <label className="row small">
                <input type="checkbox"/> Sound
                </label>
                <select className="select" id="soundStyle" title="Alert tone">
                <option value="chime">Chime</option><option value="bell">Bell</option>
                <option value="beep">Beep</option><option value="retro">Retro</option>
                </select> 
            </div>
        </>
    )
}

export default TopNavigation