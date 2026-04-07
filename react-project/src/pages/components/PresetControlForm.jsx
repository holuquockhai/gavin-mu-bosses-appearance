import { useSelector } from "react-redux";
import PresetModal from "./PresetModal";
import { useState } from "react";

function PresetControlForm(){
    const presetSettings = useSelector(state => state.presetSettings.value);
    const [presetModalState, setPresetModalState] = useState(1);

    const presethandleBtnClick = (value) => {
        setPresetModalState(value);
    };

    return (
        <>
            {/** Preset control */}
            <div className="row justify-content-center">
                <div className="hstack gap-2">
                    <div className="col-5 hstack gap-2">
                        <span className="small text-muted text-end text-end text-nowrap">Presets (max 3):</span>
                        <select id="presetSelect" className="select form-select">
                            <option key={0} value="">(no presets)</option>
                            {presetSettings.map(
                                (setting) => (
                                    <option key={setting.id} value={setting.name}>{setting.name}</option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="col-7 hstack gap-2">
                        <button className="btn btn-outline-secondary" id="applyPresetBtn">Apply</button>
                        <button className="btn btn-outline-success" id="savePresetBtn">Save</button>
                        <button className="btn btn-outline-primary" id="newPresetBtn" data-bs-toggle="modal" data-bs-target="#presetModal" onClick={(e)=>presethandleBtnClick(1)}>New</button>
                        <button className="btn btn-outline-info" id="renamePresetBtn" data-bs-toggle="modal" data-bs-target="#presetModal" onClick={(e)=>presethandleBtnClick(2)}>Rename</button>
                        <button type="button" className="btn btn-outline-danger" id="deletePresetBtn" data-bs-toggle="modal" data-bs-target="#presetModal" onClick={(e) => presethandleBtnClick(3)}>Delete</button>
                    </div>
                </div>
                
            </div>
            {/** #Preset control */}

            <PresetModal presetModalState = {presetModalState}/>
        </>
    );
};

export default PresetControlForm;