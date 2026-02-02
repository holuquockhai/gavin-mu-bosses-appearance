function MainContent({bosses, channels}){
    return (
        <>
            {/*<!-- MIDDLE -->*/}
            <div className="input-group">
                <div className="p-3 card rounded-4 unified" id="showHideCard">
                    <div className="row">
                        <h5 className="card-title col-8">Show / Hide Boss Cards</h5>
                        <span className="small col-4 text-muted text-end">Use to temporarily hide cards</span>
                    </div>

                    {/** Render bosses filter checkboxes */}
                    <div className="row mt-3 mb-3">
                        <div className="chips d-flex flex-wrap" id="visChips">
                            {bosses.map((boss)=>(
                                <div className="form-check form-switch pe-4" key={boss.id}>
                                    <input className="form-check-input" type="checkbox" role="switch" id="switchCheckDefault"/>
                                    <label className="form-check-label" htmlFor="switchCheckDefault">{boss.title}</label>
                                </div>
                                
                            ))}
                        </div>
                    </div>
                    {/** #Render bosses filter checkboxes */}

                    {/** Preset control */}
                    <div className="row justify-content-center">
                        <div className="hstack gap-2">
                            <div className="col-5 hstack gap-2">
                                <span className="small text-muted text-end text-end text-nowrap">Presets (max 3):</span>
                                <select id="presetSelect" className="select form-select">
                                    <option value="">(no presets)</option>
                                </select>
                            </div>
                            <div className="col-7 hstack gap-2">
                                <button className="btn btn-outline-secondary" id="applyPresetBtn">Apply</button>
                                <button className="btn btn-outline-secondary" id="savePresetBtn">Save</button>
                                <button className="btn btn-outline-secondary" id="newPresetBtn">New</button>
                                <button className="btn btn-outline-secondary" id="renamePresetBtn">Rename</button>
                                <button type="button" className="btn btn-outline-danger" id="deletePresetBtn">Delete</button>
                            </div>
                        </div>
                        
                    </div>
                    {/** #Preset control */}
                </div>

            </div>
            <div className="row justify-content-center mt-3 mb-3">
                <div className="channel-row unified col-4 ">
                    <select className="select form-select" id="channelSelect" title="Channel" aria-label="Default select example">
                        <option selected>Open this select menu</option>
                        {/* <option value="1">Channel 1</option>
                        <option value="2">Channel 2</option>
                        <option value="3">Channel 1</option> */}
                        
                        {channels.map(
                            (channel) => (
                                <option key= {channel.value} value={channel.value}>{channel.title}</option>
                            )
                        )}
                    </select>
                </div>

                <div id="cards" className="unified"></div>
            </div>
        </>
    );                                            
}

export default MainContent;
