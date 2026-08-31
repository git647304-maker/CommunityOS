import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import OrderForm from "./components/OrderForm";
import Services from "./components/Services";
import ActivityView from "./components/ActivityView";
import ProviderDashboard from "./components/ProviderDashboard";
import ManagerDashboard from "./components/ManagerDashboard";

import { initSocket, closeSocket } from "./services/socket";

import "./styles.css";

const ROLE_LABELS = {
  resident: "Resident",
  manager: "Community Manager",
  provider: "Service Provider",
  worker: "Field Worker",
  admin: "Platform Admin",
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("co_user") || "null");
  } catch {
    return null;
  }
}

function getRole(user) {
  const roles = user?.roles || [];

  const rawRole =
    roles[0]?.role ||
    user?.role ||
    user?.user_metadata?.role ||
    "resident";

  return String(rawRole)
    .toLowerCase()
    .replace("provider_rep", "provider")
    .replace("platform_admin", "admin");
}

function getUserInitial(user) {
  const name =
    user?.fullName ||
    user?.full_name ||
    user?.email?.split("@")[0] ||
    "C";

  return name.charAt(0).toUpperCase();
}

function Brand({ compact = false }) {
  return (
    <div className={`brand-mark ${compact ? "compact" : ""}`}>
      <span className="brand-icon">
        <Sparkles size={16} />
      </span>

      <span>
        Community<span className="brand-os">OS</span>
      </span>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("co_token")
  );

  const [user, setUser] = useState(getStoredUser);

  const [view, setView] = useState("dashboard");
  const [selectedServiceForOrder, setSelectedServiceForOrder] =
    useState(null);

  const [authMode, setAuthMode] = useState("login");

  const [mobileOpen, setMobileOpen] = useState(false);

  const role = useMemo(() => getRole(user), [user]);

  const roleLabel =
    ROLE_LABELS[role] || "Community Member";

  const userInitial = getUserInitial(user);

  /*
   * =========================================================
   * REALTIME SOCKET
   * =========================================================
   */

  useEffect(() => {
    if (!token) {
      closeSocket();
      return;
    }

    // Pass the user object so the socket helper can emit identity on connect
    initSocket(token, user);

    return () => {
      closeSocket();
    };
  }, [token, user]);

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */

  function handleLogin(payload) {
    if (!payload?.token) {
      console.error(
        "Login response did not contain a token."
      );
      return;
    }

    const loggedInUser = payload.user || null;

    localStorage.setItem(
      "co_token",
      payload.token
    );

    localStorage.setItem(
      "co_user",
      JSON.stringify(loggedInUser)
    );

    setToken(payload.token);
    setUser(loggedInUser);
    setView("dashboard");
    setAuthMode("login");
  }

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  function handleLogout() {
    closeSocket();

    localStorage.removeItem("co_token");
    localStorage.removeItem("co_user");

    setToken(null);
    setUser(null);
    setView("dashboard");
    setAuthMode("login");
  }

  /*
   * =========================================================
   * ROLE-BASED NAVIGATION
   * =========================================================
   */

  const navigation = useMemo(() => {
    const items = [
      {
        id: "dashboard",
        label: "Overview",
        icon: LayoutDashboard,
      },
    ];

    if (role === "resident") {
      items.push(
        {
          id: "services",
          label: "Services",
          icon: Package,
        },
        {
          id: "order",
          label: "Request Service",
          icon: ClipboardList,
        },
        {
          id: "activity",
          label: "Activity",
          icon: Activity,
        }
      );
    }

    if (role === "provider") {
      items.push({
        id: "provider",
        label: "Operations",
        icon: Truck,
      });
    }

    if (role === "manager" || role === "admin") {
      items.push({
        id: "manager",
        label: "Operations Center",
        icon: Building2,
      });
    }

    return items;
  }, [role]);

  /*
   * =========================================================
   * NAVIGATION HANDLER
   * =========================================================
   */

  function handleNavigate(nextView) {
    const allowedViews =
      navigation.map((item) => item.id);

    if (!allowedViews.includes(nextView)) {
      setView("dashboard");
      return;
    }

    setView(nextView);
  }

  /*
   * =========================================================
   * VIEW RENDERER
   * =========================================================
   */

  function renderView() {
    switch (view) {
     case "services":
  return (
    <Services
      token={token}
      onRequest={({ service, provider }) => {
        setSelectedServiceForOrder({
          service,
          provider,
        });

        handleNavigate("order");
      }}
    />
  );

     case "order":
  return (
    <OrderForm
      token={token}
      initialService={
        selectedServiceForOrder?.service || null
      }
      initialProvider={
        selectedServiceForOrder?.provider || null
      }
      onCreated={() => {
        setSelectedServiceForOrder(null);
        handleNavigate("activity");
      }}
    />
  );

     case "activity":
       return (
         <ActivityView token={token} />
       );

     case "provider":
       return (
         <ProviderDashboard
           token={token}
           user={user}
         />
       );

     case "manager":
       return (
         <ManagerDashboard
           token={token}
           user={user}
         />
       );

     case "dashboard":
     default:
       return (
         <Dashboard
           token={token}
           user={user}
           role={role}
           onNavigate={handleNavigate}
         />
       );
    }
  }

  /*
   * =========================================================
   * AUTHENTICATION GATE
   * =========================================================
   */

  if (!token) {
    if (authMode === "register") {
      return (
        <Register
          onRegistered={() =>
            setAuthMode("login")
          }
          onBackToLogin={() =>
            setAuthMode("login")
          }
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onRegister={() =>
          setAuthMode("register")
        }
      />
    );
  }

  /*
   * =========================================================
   * AUTHENTICATED APPLICATION
   * =========================================================
   */

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${
          mobileOpen ? "open" : ""
        }`}
        aria-label="Main navigation"
      >
        <div className="sidebar-top">
          <Brand />

          <button
            type="button"
            className="icon-btn mobile-close"
            aria-label="Close navigation"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-card">
          <div className="workspace-avatar">
            <Building2 size={18} />
          </div>

          <div>
            <strong>
              {user?.communityName ||
                "Green Valley Estate"}
            </strong>

            <span>{roleLabel}</span>
          </div>
        </div>

        <nav className="side-nav">
          <span className="nav-caption">
            Workspace
          </span>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.id}
                className={`side-link ${
                  view === item.id
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  handleNavigate(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <span className="nav-caption nav-caption-spaced">
            Account
          </span>

          <button
            type="button"
            className="side-link"
          >
            <Bell size={18} />
            <span>Notifications</span>
            <span className="notification-dot" />
          </button>

          <button
            type="button"
            className="side-link"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-row">
            <div className="avatar">
              {userInitial}
            </div>

            <div className="profile-copy">
              <strong>
                {user?.fullName ||
                  user?.full_name ||
                  user?.email?.split("@")[0] ||
                  "Community User"}
              </strong>

              <span>
                {user?.email || roleLabel}
              </span>
            </div>

            <button
              type="button"
              className="icon-btn"
              title="Sign out"
              aria-label="Sign out"
              onClick={handleLogout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <div className="main-shell">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label="Open navigation"
            onClick={() =>
              setMobileOpen(true)
            }
          >
            <Menu size={22} />
          </button>

          <div className="topbar-context">
            <span className="eyebrow">
              COMMUNITY OPERATIONS
            </span>

            <strong>
              {view === "dashboard"
                ? "Overview"
                : navigation.find(
                    (item) =>
                      item.id === view
                  )?.label ||
                  "Workspace"}
            </strong>
          </div>

          <div className="topbar-actions">
            <div className="status-pill">
              <span />
              System operational
            </div>

            <button
              type="button"
              className="icon-btn notification-btn"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i />
            </button>

            <div className="top-avatar">
              {userInitial}
            </div>
          </div>
        </header>

        <main className="page-content">
          {renderView()}
        </main>

        <footer className="app-footer">
          <span>CommunityOS</span>

          <span>
            Connected to your community services
          </span>

          <span>v1.0 MVP</span>
        </footer>
      </div>
    </div>
  );
}
