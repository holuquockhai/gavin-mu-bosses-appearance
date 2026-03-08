import { useDispatch } from "react-redux";
import { createPreset } from "../js/presetSlice";
function PresetModal({presetModalState}){
    const dispatch = useDispatch()

    // Generate modal title by state number
    const  generateModalTitle = () => {
        switch (presetModalState){
                case 1:
                    return "New";
                case 2: 
                    return "Rename";
                case 3:
                    return "Delete"
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
                        <form>
                            <div className="mb-3">
                                <label htmlFor="preset-name" className="col-form-label">Preset Name:</label>
                                <input type="text" className="form-control" id="preset-name"/>
                            </div>
                        </form>
                    </div>

                    <div className="modal-footer">
                        {presetModalState === 3 ? (
                            <>
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" className="btn btn-danger">Delete</button>
                            </>
                           
                        ) : (
                            <>
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-primary">Save</button>
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