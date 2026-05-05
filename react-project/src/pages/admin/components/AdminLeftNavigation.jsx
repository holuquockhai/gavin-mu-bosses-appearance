import { NavLink } from "react-router-dom";

const adminLinks = [
  { to: "/", label: "Home", end: true, icon: "house-door" },
  { to: "/admin/users", label: "Users", icon: "people" },
  { to: "/admin/create-boss", label: "Bosses", icon: "shield" },
  { to: "/admin/channels", label: "Channels", icon: "diagram-3" },
];

const AdminLeftNavigation = ({ mobile = false, onNavigate }) => {
  return (
    <nav
      className={
        mobile
          ? "admin-mobile-navigation nav nav-pills flex-column gap-2"
          : "admin-top-navigation d-none d-md-flex align-items-center gap-1"
      }
    >
      {adminLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `nav-link d-inline-flex align-items-center gap-2 ${mobile ? "" : "px-2"} ${isActive ? "active fw-semibold" : ""}`
          }
        >
          <AdminNavIcon name={link.icon} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

function AdminNavIcon({ name }) {
  return <i className={`bi bi-${name} admin-nav-icon`} aria-hidden="true"></i>;
}

export default AdminLeftNavigation;
