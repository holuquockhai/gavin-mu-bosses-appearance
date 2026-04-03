import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { markBossAsShowed } from '../../js/bossSlice';
import BossTimerCard from "./BossTimerCard";
import PresetControlForm from './PresetControlForm';


function MainContent(){
    const dispatch = useDispatch();

    // Load bosses redux store values
    const bosses = useSelector(state => state.bosses.value);

    const channels = useSelector(state => state.channels.value);

    // use currentPreset usestate to determine preset's showed cards
    const [currenPreset, setCurrentPreset] = useState({});

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

                    <PresetControlForm />
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
