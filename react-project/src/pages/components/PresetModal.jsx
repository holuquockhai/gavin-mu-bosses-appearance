import { useDispatch } from "react-redux";
import { createPreset, deletePreset } from "../../js/presetSlice";
import { useState } from "react";

function PresetModal({presetModalState, currenPreset}){
    const dispatch = useDispatch();
    const [presetName, setPresetName] = useState("") ;

    const handleInputChange = (event) => {
        // Access the new value via event.target.value
        setPresetName(event.target.value);
        // console.log('Current value:', event.target.value);
    };

    // Generate modal title by state number
    const  generateModalTitle = () => {
        switch (presetModalState){
                case 1:
                    return "New";
                case 2: 
                    return "Rename";
                case 3:
                    return "Delete";
            }
    }


    return (
        <>
            <div className="modal fade" id="presetModal" tabIndex="-1" aria-labelledby="newPresetModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="newPresetModalLabel">{generateModalTitle()} Preset</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        {presetModalState !== 3 ? ( 
                        <form>
                            <div className="mb-3">
                                <label htmlFor="preset-name" className="col-form-label">Preset Name:</label>
                                <input type="text" value={presetName} className="form-control" id="preset-name" onChange={handleInputChange}/>
                            </div>
                        </form> ) : (
                            <div className="mb-3">
                                <p>Are you sure to delete this preset?</p>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        {presetModalState === 3 ? (
                            <>
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" className="btn btn-danger" 
                                    onClick={(e) => dispatch(deletePreset())}                                >
                                    Delete
                                </button>
                            </>
                           
                        ) : (
                            <>
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-primary" data-bs-dismiss="modal"
                                onClick={(e) => {
                                    if (presetModalState === 1) {
                                        dispatch(createPreset(presetName)) 
                                    }
                                        
                                    else{
                                        e.defaultPrevented 
                                    }
                                        }}>
                                    Save
                                </button>
                            </>
                        )}
                        
                    </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PresetModal;