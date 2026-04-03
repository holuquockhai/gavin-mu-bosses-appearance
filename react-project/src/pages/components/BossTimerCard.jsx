import { useDispatch, useSelector } from "react-redux";
import { markBossAsShowed } from '../../js/bossSlice';

function BossTimerCard({boss}){
    const dispatch = useDispatch();
    const hoursList = useSelector(state => state.timerHours.value);
    const minuteList = useSelector(state => state.timerMinutes.value);
    return(
        <>
        <div className={`boss-detail input-group ${boss.isShowed ? 'show mt-3 mb-0' : ''}`}>
            <div className="col-12 p-3 card rounded-4 unified" id="showHideCard">
                <div className="row">
                    <h5 className="card-title col-8">{boss.name}</h5>
                    <span className="small col-4 text-muted text-end">
                        <button type="button" className="btn-close" aria-label="Close" onClick={(e) => dispatch(markBossAsShowed(boss.id))}></button>
                    </span>
                </div>

                {/** Render bosses filter checkboxes */}
                <div className="row mt-3 mb-3">
                    <div className="hstack gap-2" id="visChips">
                        <select id="presetSelect" className="select form-select">
                            <option key={0} value="-1" defaultValue={0}>Hour</option>
                            {hoursList.map(
                                (hour) => (
                                    <option key={hour.value} value={hour.value}>{hour.label}</option>
                                )
                            )}
                        </select>
                        <select id="presetSelect" className="select form-select">
                            <option key={0} value="-1">Minute</option>
                            {minuteList.map(
                                (minute) => (
                                    <option key= {minute.value} value={minute.value}>{minute.label}</option>
                                )
                            )}
                        </select>
                    </div>
                </div>
                {/** #Render bosses filter checkboxes */}

                {/** Preset control */}
                <div className="row justify-content-center">
                    <div className="hstack gap-2">
                        <div className="col-7 hstack gap-2 ms-auto">
                            <button type="button" className="btn btn-outline-secondary" id="applyPresetBtn">Set</button>
                            <button type="button" className="btn btn-outline-secondary" id="deletePresetBtn">Clear</button>
                        </div>
                    </div>
                    
                </div>
                {/** #Preset control */}
            </div>

            </div>
        </>
        
    );
}

export default BossTimerCard