function TopNavigation(){
    return(
        <>
        <div className="row input-group">
            {/* <a class="btn btn-primary" data-bs-toggle="offcanvas" href="#offcanvasExample" role="button" aria-controls="offcanvasExample">
            Link with href
            </a> */}

            <nav class="navbar">
                <div class="fixed-top p-3">
                    <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample" aria-controls="offcanvasExample" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                    </button>
                </div>
            </nav>

            <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
                <div class="offcanvas-header">
                    <h5 class="offcanvas-title" id="offcanvasExampleLabel">Settings</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <hr class="my-1"/>
                <div class="offcanvas-body">
                    <div>   
                        Setup your theme Dark Mode or Light Mode, sound and notification
                    </div>
                    <div class="dropdown mt-3">
                   
                    <div className="form-check form-switch pe-4">
                            <input className="form-check-input" type="checkbox" role="switch" id="switchCheckDefault"/>
                            <label className="small form-check-label" htmlFor="switchCheckDefault">Dark mode</label>
                        </div>

                        <div className="form-check form-switch pe-4">
                            <input className="form-check-input" type="checkbox" role="switch" id="switchCheckDefault"/>
                            <label className="small form-check-label" htmlFor="switchCheckDefault">Sound</label>
                        </div>

                        <select className="select form-select" id="soundStyle" title="Alert tone">
                            <option value="chime">Chime</option><option value="bell">Bell</option>
                            <option value="beep">Beep</option><option value="retro">Retro</option>
                        </select> 

                    </div>
                </div>
            </div>
        </div>
           
        
        </>
    )
}

export default TopNavigation