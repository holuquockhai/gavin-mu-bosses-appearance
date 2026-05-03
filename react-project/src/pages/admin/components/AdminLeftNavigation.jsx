import { NavLink } from "react-router-dom";

const adminLinks = [
  { to: "/", label: "Home", end: true, icon: "house-door" },
  { to: "/admin/users", label: "Users", icon: "people" },
  { to: "/admin/create-boss", label: "Bosses", icon: "shield" },
  { to: "/admin/channels", label: "Channels", icon: "diagram-3" },
];

const AdminLeftNavigation = ({ mobile = false, onNavigate }) => {
  return (
    <nav className={mobile
      ? "admin-mobile-navigation nav nav-pills flex-column gap-2"
      : "admin-top-navigation d-none d-md-flex align-items-center gap-1"
    }>
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
  const iconProps = {
    className: `bi bi-${name} admin-nav-icon`,
    width: "18",
    height: "18",
    viewBox: "0 0 16 16",
    fill: "currentColor",
    "aria-hidden": "true",
  };

  if (name === "house-door") {
    return (
      <svg {...iconProps}>
        <path d="M8.354 1.146a.5.5 0 0 1 .292 0l6 2A.5.5 0 0 1 15 3.618V14.5a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5V10H6v4.5a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5V3.618a.5.5 0 0 1 .354-.472l6-2Z" />
        <path d="M2 4.236v9.764h3V9.5A.5.5 0 0 1 5.5 9h5a.5.5 0 0 1 .5.5V14h3V4.236L8 2.236 2 4.236Z" />
      </svg>
    );
  }

  if (name === "people") {
    return (
      <svg {...iconProps}>
        <path d="M15 14s1 0 1 1-1 4-5 4-5-3-5-4 1-1 1-1h8Z" />
        <path d="M11 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M5.216 14A2.238 2.238 0 0 0 5 15c0 1.01.377 2.042 1.09 2.904C4.512 17.614 3 16.772 3 15c0-1 1-1 1-1h1.216Z" />
        <path d="M4.5 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...iconProps}>
        <path d="M8 1.146a.5.5 0 0 1 .354 0l6 2A.5.5 0 0 1 14.5 3.5v4.447c0 3.382-2.234 5.797-6.354 7.032a.5.5 0 0 1-.292 0C3.734 13.744 1.5 11.329 1.5 7.947V3.5a.5.5 0 0 1 .146-.354l6-2Z" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <path d="M6 2a2 2 0 0 0-2 2v1.5a2 2 0 0 0 1.5 1.938v1.124A2 2 0 0 0 4 10.5V12a2 2 0 0 0 1.5 1.938v1.124A2 2 0 0 0 4 17v1.5A2 2 0 0 0 6 20h1.5A2 2 0 0 0 9.438 18.5h1.124A2 2 0 0 0 12.5 20H14a2 2 0 0 0 2-2v-1.5a2 2 0 0 0-1.5-1.938v-1.124A2 2 0 0 0 16 11.5V10a2 2 0 0 0-1.5-1.938V6.938A2 2 0 0 0 16 5V3.5A2 2 0 0 0 14 2h-1.5A2 2 0 0 0 10.562 3.5H9.438A2 2 0 0 0 7.5 2H6Z" />
    </svg>
  );
}

export default AdminLeftNavigation;
