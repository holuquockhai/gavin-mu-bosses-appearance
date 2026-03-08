import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { markBossAsShowed } from '../js/bossSlice';
import BossTimerCard from "./BossTimerCard"


function MainContent({}){
    const dispatch = useDispatch();

    // Load bosses redux store values
    const bosses = useSelector(state => state.bosses.value);

    const channels = useSelector(state => state.channels.value);

    const hoursList = Array.from({ length: 25 }, (_, index) => ({
        value: index.toString(),
        label: String(index).padStart(2, "0")
    }));

    const minuteList = Array.from({ length: 61 }, (_, index) => ({
        value: index.toString(),
        label: String(index).padStart(2, "0")
    }));

    return (
        <>
            {/*<!-- MIDDLE -->*/}
            <div className="row input-group">
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
                                    <input className="form-check-input" 
                                    type="checkbox" 
                                    role="switch" 
                                    id={`switchCheck-${boss.name}`}
                                    checked={boss.isShowed}
                                    onChange={(e) => dispatch(markBossAsShowed(boss.id))}
                                />
                                    <label className="form-check-label" htmlFor={`switchCheck-${boss.name}`}>{boss.name}</label>
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
                                    <option key={0} value="">(no presets)</option>
                                </select>
                            </div>
                            <div className="col-7 hstack gap-2">
                                <button className="btn btn-outline-secondary" id="applyPresetBtn">Apply</button>
                                <button className="btn btn-outline-success" id="savePresetBtn">Save</button>
                                <button className="btn btn-outline-primary" id="newPresetBtn">New</button>
                                <button className="btn btn-outline-info" id="renamePresetBtn">Rename</button>
                                <button type="button" className="btn btn-outline-danger" id="deletePresetBtn">Delete</button>
                            </div>
                        </div>
                        
                    </div>
                    {/** #Preset control */}
                </div>

            </div>
            <div className="row justify-content-center mt-3">
                <div className="channel-row unified col-4 ">
                    <select className="select form-select" id="channelSelect" title="Channel" aria-label="Default select example">
                        <option key={0} defaultValue>Open this select menu</option>
                        {channels.map(
                            (channel) => (
                                <option key={channel.id} value={channel.name}>{channel.name}</option>
                            )
                        )}
                    </select>
                </div>
            </div>

            <div className="row">
                {bosses.map((boss)=>(
                    <BossTimerCard key={boss.id} boss={boss} />         
                ))}
                
            </div>
        </>
    );                                            
}

export default MainContent;
