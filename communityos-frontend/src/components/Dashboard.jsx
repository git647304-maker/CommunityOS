import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Droplet,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  Zap,
} from "lucide-react";

import * as orderService from "../services/orders.js";
import * as communityService from "../services/communities.js";

function getFirstName(user) {
  const name =
    user?.fullName ||
    user?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  return name.split(" ")[0];
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date) {
  if (!date) return "Recently";

  return new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getOrderStatus(status) {
  const normalized = String(status || "CREATED").toUpperCase();

  if (["COMPLETED", "DELIVERED", "RESOLVED"].includes(normalized)) {
    return "success";
  }

  if (["CANCELLED", "FAILED"].includes(normalized)) {
    return "danger";
  }

  if (["PROCESSING", "IN_PROGRESS", "ACCEPTED"].includes(normalized)) {
    return "info";
  }

  return "warning";
}

export default function Dashboard({
  token,
  user,
  role,
  onNavigate,
}) {
  const [community, setCommunity] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!token) return;

      /*
       * Load communities independently.
       * A failure here must not stop orders from loading.
       */
      communityService
        .getCommunities()
        .then((communities) => {
          if (cancelled) return;

          if (communities?.length > 0) {
            setCommunity(communities[0]);
          }
        })
        .catch((error) => {
          console.error(
            "Failed to load communities:",
            error
          );
        });

      /*
       * Load orders independently.
       * A failure here must not stop the dashboard itself.
       */
      orderService
        .getOrders(1, 5)
        .then((orders) => {
          if (cancelled) return;

          const orderData = orders?.data || [];

          setRecentOrders(orderData);

          setStats({
            totalOrders:
              orders?.pagination?.total || 0,

            pendingOrders:
              orderData.filter((order) =>
                [
                  "CREATED",
                  "PENDING",
                  "PROCESSING",
                  "ACCEPTED",
                  "IN_PROGRESS",
                ].includes(
                  String(order.status || "").toUpperCase()
                )
              ).length,

            completedOrders:
              orderData.filter((order) =>
                [
                  "COMPLETED",
                  "DELIVERED",
                  "RESOLVED",
                ].includes(
                  String(order.status || "").toUpperCase()
                )
              ).length,
          });
        })
        .catch((error) => {
          console.error(
            "Failed to load orders:",
            error
          );
        });
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const firstName = getFirstName(user);

  const communityName =
    community?.name ||
    user?.communityName ||
    "Your Community";

  return (
    <div className="page-content dashboard-page">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="dashboard-welcome">
        <div>
          <span className="section-kicker">
            COMMUNITY DASHBOARD
          </span>

          <h1>
            Good morning, {firstName}
          </h1>

          <p>
            Here's what's happening in{" "}
            <strong>{communityName}</strong> today.
          </p>
        </div>

        <div className="dashboard-community-status">
          <div className="community-status-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <span>COMMUNITY PULSE</span>

            <strong>
              Everything operational
            </strong>
          </div>

          <span className="live-indicator">
            <i />
            Live
          </span>
        </div>
      </section>

      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="dashboard-stats">
        <article className="stat-card">
          <div className="stat-card-top">
            <div className="dashboard-stat-icon warning">
              <Clock3 size={20} />
            </div>

            <span className="stat-trend neutral">
              Active
            </span>
          </div>

          <span className="stat-label">
            Pending requests
          </span>

          <strong className="stat-value">
            {stats.pendingOrders}
          </strong>

          <p className="stat-description">
            Requests currently being processed
          </p>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <div className="dashboard-stat-icon success">
              <CheckCircle2 size={20} />
            </div>

            <span className="stat-trend positive">
              Completed
            </span>
          </div>

          <span className="stat-label">
            Completed services
          </span>

          <strong className="stat-value">
            {stats.completedOrders}
          </strong>

          <p className="stat-description">
            Successfully resolved requests
          </p>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <div className="dashboard-stat-icon info">
              <ShoppingBag size={20} />
            </div>

            <span className="stat-trend neutral">
              All time
            </span>
          </div>

          <span className="stat-label">
            Total requests
          </span>

          <strong className="stat-value">
            {stats.totalOrders}
          </strong>

          <p className="stat-description">
            Services requested through CommunityOS
          </p>
        </article>
      </section>

      {/* =====================================================
          RESIDENT CONTENT
      ====================================================== */}

      {role === "resident" && (
        <>
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <span className="section-kicker">
                  ESSENTIAL SERVICES
                </span>

                <h2>
                  What do you need today?
                </h2>
              </div>

              <button
                type="button"
                className="text-action"
                onClick={() => onNavigate("services")}
              >
                View all services
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="quick-service-grid">
              <button
                type="button"
                className="quick-service-card"
                onClick={() => onNavigate("services")}
              >
                <span className="quick-service-icon water">
                  <Droplet size={22} />
                </span>

                <span className="quick-service-content">
                  <strong>Water</strong>

                  <small>
                    Delivery and water services
                  </small>
                </span>

                <ArrowRight
                  className="quick-service-arrow"
                  size={18}
                />
              </button>

              <button
                type="button"
                className="quick-service-card"
                onClick={() => onNavigate("services")}
              >
                <span className="quick-service-icon power">
                  <Zap size={22} />
                </span>

                <span className="quick-service-content">
                  <strong>Utilities</strong>

                  <small>
                    Available community services
                  </small>
                </span>

                <ArrowRight
                  className="quick-service-arrow"
                  size={18}
                />
              </button>

              <button
                type="button"
                className="quick-service-card"
                onClick={() => onNavigate("services")}
              >
                <span className="quick-service-icon maintenance">
                  <Wrench size={22} />
                </span>

                <span className="quick-service-content">
                  <strong>Maintenance</strong>

                  <small>
                    Report or request assistance
                  </small>
                </span>

                <ArrowRight
                  className="quick-service-arrow"
                  size={18}
                />
              </button>

              <button
                type="button"
                className="quick-service-card quick-service-create"
                onClick={() => onNavigate("order")}
              >
                <span className="quick-service-icon create">
                  <Plus size={22} />
                </span>

                <span className="quick-service-content">
                  <strong>New request</strong>

                  <small>
                    Start a service request
                  </small>
                </span>

                <ArrowRight
                  className="quick-service-arrow"
                  size={18}
                />
              </button>
            </div>
          </section>

          {/* =================================================
              COMMUNITY PULSE
          ================================================= */}

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <span className="section-kicker">
                  LIVE STATUS
                </span>

                <h2>
                  Community Pulse
                </h2>
              </div>

              <span className="pulse-updated">
                Updated just now
              </span>
            </div>

            <div className="pulse-grid pulse-grid-dashboard">
              <div className="pulse-item">
                <div className="pulse-service">
                  <span className="pulse-service-icon">
                    <Droplet size={17} />
                  </span>

                  <span>
                    <strong>Water</strong>
                    <small>
                      Supply operating normally
                    </small>
                  </span>
                </div>

                <span className="status-badge status-normal">
                  <i />
                  Normal
                </span>
              </div>

              <div className="pulse-item">
                <div className="pulse-service">
                  <span className="pulse-service-icon">
                    <Zap size={17} />
                  </span>

                  <span>
                    <strong>Electricity</strong>
                    <small>
                      No known disruptions
                    </small>
                  </span>
                </div>

                <span className="status-badge status-normal">
                  <i />
                  Normal
                </span>
              </div>

              <div className="pulse-item">
                <div className="pulse-service">
                  <span className="pulse-service-icon">
                    <Wrench size={17} />
                  </span>

                  <span>
                    <strong>Maintenance</strong>
                    <small>
                      Service team available
                    </small>
                  </span>
                </div>

                <span className="status-badge status-normal">
                  <i />
                  Normal
                </span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* =====================================================
          RECENT ORDERS
      ====================================================== */}

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <span className="section-kicker">
              SERVICE ACTIVITY
            </span>

            <h2>
              Recent requests
            </h2>
          </div>

          {recentOrders.length > 0 && (
            <button
              type="button"
              className="text-action"
              onClick={() => onNavigate("activity")}
            >
              View activity
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="recent-orders-card">
          {recentOrders.length === 0 ? (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon">
                <PackageCheck size={28} />
              </div>

              <div>
                <h3>
                  No service requests yet
                </h3>

                <p>
                  When you request a service, its
                  progress will appear here.
                </p>
              </div>

              {role === "resident" && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => onNavigate("services")}
                >
                  <Plus size={17} />
                  Request service
                </button>
              )}
            </div>
          ) : (
            <div className="recent-orders-list">
              {recentOrders.map((order) => (
                <article
                  className="recent-order-row"
                  key={order.id}
                >
                  <div className="recent-order-main">
                    <div className="order-service-icon">
                      <Droplet size={19} />
                    </div>

                    <div>
                      <strong>
                        Order #
                        {String(order.id).slice(0, 8)}
                      </strong>

                      <span>
                        Created{" "}
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="recent-order-meta">
                    <strong>
                      {formatCurrency(order.total)}
                    </strong>

                    <span
                      className={`order-status-badge ${getOrderStatus(
                        order.status
                      )}`}
                    >
                      {String(order.status || "Created")
                        .replaceAll("_", " ")}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}