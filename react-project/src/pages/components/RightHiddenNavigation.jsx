function RightHiddenNavigation(){
    return (
        <>
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
    );
}

export default RightHiddenNavigation;