import {
  Bell,
  Menu,
  Search,
} from "lucide-react";

function getInitials(user) {
  const name =
    user?.fullName ||
    user?.full_name ||
    user?.email?.split("@")[0] ||
    "CU";

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Header({
  user,
  title = "Overview",
  subtitle = "Community operations",
  onMenuClick,
  onNotificationsClick,
}) {
  const initials = getInitials(user);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          type="button"
          className="icon-btn header-menu-btn"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu size={21} />
        </button>

        <div className="header-title">
          <span>{subtitle}</span>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="header-search"
          aria-label="Search CommunityOS"
        >
          <Search size={18} />
          <span>Search</span>
          <kbd>⌘ K</kbd>
        </button>

        <button
          type="button"
          className="icon-btn notification-button"
          aria-label="View notifications"
          onClick={onNotificationsClick}
        >
          <Bell size={19} />
          <span className="notification-indicator" />
        </button>

        <div className="header-user">
          <div className="header-avatar">
            {initials}
          </div>

          <div className="header-user-info">
            <strong>
              {user?.fullName ||
                user?.full_name ||
                user?.email?.split("@")[0] ||
                "Community User"}
            </strong>

            <span>{user?.email || "CommunityOS"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}