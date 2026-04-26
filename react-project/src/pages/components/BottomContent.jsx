function BottomContent(){
    const currentYear = new Date().getFullYear();

    return(
        <>
            <div className="row fixed-bottom p-3 bg-body-tertiary border-top">
                <div className="col-12 text-center small text-muted">
                    &copy; {currentYear} MU Boss Timer. All rights reserved.
                </div>
            </div>
        </>
    );

}

export default BottomContent;
