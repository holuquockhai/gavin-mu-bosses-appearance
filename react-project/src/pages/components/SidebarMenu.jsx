import { Link } from "react-router-dom";
import { useState } from "react";
import { Button, Offcanvas } from "react-bootstrap";
export default function SidebarMenu() {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button className="btn btn-primary" onClick={handleShow}>
        Open menu
      </Button>

      <Offcanvas show={show} onHide={handleClose} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <div className="d-flex flex-column gap-2">
            <Link to="/" onClick={handleClose}>
              Home
            </Link>
            <Link
              to="/admin/create-boss"
              className="nav-link active"

              // onClick={() => closeOffcanvas()}
            >
              Bosses Management
            </Link>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
