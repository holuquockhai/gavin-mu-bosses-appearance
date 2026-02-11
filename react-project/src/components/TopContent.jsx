function TopContent(){
    return(
        <>
        <nav className="navbar fixed-top bg-body-tertiary">
            <div className="container-fluid">
                <div className="row input-group">
                    {/* <a class="btn btn-primary" data-bs-toggle="offcanvas" href="#offcanvasExample" role="button" aria-controls="offcanvasExample">
                    Link with href
                    </a> */}
                    <div className="col-1">
                        <nav className="navbar">
                             <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample" aria-controls="offcanvasExample" aria-expanded="false" aria-label="Toggle navigation">
                                    <span className="navbar-toggler-icon"></span>
                            </button>
                        </nav>
                    </div>
                    <div className="col-2 ms-auto mt-3">
                        <button className="btn">Logout</button>
                        <button type="button" className="btn" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16">
                            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"></path>
                            </svg>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger text-white">
                                99+
                                <span className="visually-hidden">unread messages</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
       

        <div className="offcanvas offcanvas-start" tabIndex="-1" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasExampleLabel">Settings</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <hr className="my-1"/>
                <div className="offcanvas-body">
                    <div>   
                        Setup your theme Dark Mode or Light Mode, sound and notification
                    </div>
                    <div className="dropdown mt-3">
                   
                    <div className="form-check form-switch pe-4">
                            <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch" 
                            id="switchCheckDefault"
                            />

                            <label className="small form-check-label" htmlFor="switchCheckDefault">Dark mode</label>
                        </div>

                        <div className="form-check form-switch pe-4">
                            <input className="form-check-input" type="checkbox" role="switch" id="switchCheckDefault"/>
                            <label className="small form-check-label" htmlFor="switchCheckDefault">Sound</label>
                        </div>

                        <select className="select form-select mt-3" id="soundStyle" title="Alert tone">
                            <option value="chime">Chime</option><option value="bell">Bell</option>
                            <option value="beep">Beep</option><option value="retro">Retro</option>
                        </select> 

                    </div>
                </div>
            </div>


            <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasRight"  data-bs-scroll="true" aria-labelledby="offcanvasRightLabel">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasRightLabel">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16">
  <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"></path>
</svg>
                        &nbsp; Notifications
                    </h5>
                    <a href="#" className="link-secondary ms-auto">Clear All</a>
                    
                    {/* <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button> */}
                </div>
                 <hr className="my-1"/>
                <div className="offcanvas-body">
                    <div className="alert alert-light alert-dismissible fade show" role="alert">
                        <span className="small">Gavin just setup time for ABC Boss at 12:30 pm </span> 
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>

                    <div className="alert alert-light alert-dismissible fade show" role="alert">
                        <span className="small">Gavin just setup time for ABC Boss at 12:30 pm </span> 
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>

                    <div className="alert alert-light alert-dismissible fade show" role="alert">
                        <span className="small">Gavin just setup time for ABC Boss at 12:30 pm </span> 
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>

                    <div className="alert alert-light alert-dismissible fade show" role="alert">
                        <span className="small">Gavin just setup time for ABC Boss at 12:30 pm </span> 
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>

                    <div className="alert alert-light alert-dismissible fade show" role="alert">
                        <span className="small">Gavin just setup time for ABC Boss at 12:30 pm </span> 
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>

                    <div className="alert alert-light alert-dismissible fade show" role="alert">
                        <span className="small">Gavin just setup time for ABC Boss at 12:30 pm </span> 
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>

                    <div className="alert alert-light alert-dismissible fade show" role="alert">
                        <span className="small">Gavin just setup time for ABC Boss at 12:30 pm </span> 
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>

                    <div className="alert alert-light alert-dismissible fade show" role="alert">
                        <span className="small">Gavin just setup time for ABC Boss at 12:30 pm </span> 
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                </div>
            </div>
        
        </>
    )
}

export default TopContent;