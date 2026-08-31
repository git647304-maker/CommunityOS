import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader,
  PackageCheck,
  RefreshCw,
  Truck,
} from "lucide-react";

import * as orderService from "../services/orders.js";
import { getSocket, joinOrder } from "../services/socket.js";

const STATUS_STEPS = [
  "CREATED",
  "PROVIDER_ACCEPTED",
  "WORKER_ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
];

const STATUS_LABELS = {
  CREATED: "Request created",
  PROVIDER_ACCEPTED: "Provider accepted",
  WORKER_ASSIGNED: "Worker assigned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_DESCRIPTIONS = {
  CREATED: "Your request has been received and is waiting for the provider.",
  PROVIDER_ACCEPTED: "The provider has accepted your request.",
  WORKER_ASSIGNED: "A worker or driver has been assigned to your request.",
  IN_PROGRESS: "Your service is currently being handled.",
  COMPLETED: "The provider has marked the service as completed.",
  CANCELLED: "This request was cancelled.",
};

function normalizeStatus(status) {
  return String(status || "CREATED").toUpperCase();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "Time unavailable";

  return new Date(value).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderTitle(order) {
  const firstItem = order?.items?.[0];
  return (
    firstItem?.service?.name ||
    firstItem?.serviceName ||
    "Service request"
  );
}

function getStatusTone(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "COMPLETED") return "success";
  if (normalized === "CANCELLED") return "danger";
  if (["PROVIDER_ACCEPTED", "WORKER_ASSIGNED", "IN_PROGRESS"].includes(normalized)) {
    return "info";
  }
  return "warning";
}

function getStepState(step, currentStatus) {
  const currentIndex = STATUS_STEPS.indexOf(normalizeStatus(currentStatus));
  const stepIndex = STATUS_STEPS.indexOf(step);

  if (currentStatus === "CANCELLED") return "cancelled";
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

export default function ActivityView({ token }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const refreshTimer = useRef(null);

  const selectedStatus = normalizeStatus(selectedOrder?.status);
  const statusTone = getStatusTone(selectedStatus);

  const selectedItems = useMemo(
    () => selectedOrder?.items || [],
    [selectedOrder]
  );

  async function loadOrders({ silent = false } = {}) {
    try {
      if (!silent) setLoading(true);
      setError("");

      const result = await orderService.getOrders(1, 50);

      // orders.js already returns response.data.data
      // so result may already be the array of orders.
      const nextOrders = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      console.log("Activity orders loaded:", nextOrders);

      setOrders(nextOrders);

      setSelectedOrderId((currentId) => {
        // Keep the currently selected order if it still exists.
        if (
          currentId &&
          nextOrders.some((order) => order.id === currentId)
        ) {
          return currentId;
        }

        // Otherwise automatically select the newest/first order.
        return nextOrders[0]?.id || null;
      });
    } catch (requestError) {
      console.error("Failed to load orders:", requestError);

      const message =
        requestError?.response?.data?.error?.message ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        "We could not load your orders. Please try again.";

      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function loadSelectedOrder(orderId, { silent = false } = {}) {
    if (!orderId) {
      setSelectedOrder(null);
      setTimeline([]);
      return;
    }

    try {
      if (!silent) setTimelineLoading(true);

      const [order, timelineData] = await Promise.all([
        orderService.getOrder(orderId),
        orderService.getOrderTimeline(orderId),
      ]);

      setSelectedOrder(order || null);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);

      setOrders((current) =>
        current.map((item) =>
          item.id === orderId ? { ...item, ...(order || {}) } : item
        )
      );
    } catch (requestError) {
      console.error("Failed to load selected order:", requestError);
      setError("We could not load this order. Please refresh and try again.");
    } finally {
      if (!silent) setTimelineLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [token]);

  useEffect(() => {
    loadSelectedOrder(selectedOrderId);
  }, [selectedOrderId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedOrderId) return undefined;

    joinOrder(selectedOrderId);

    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      refreshTimer.current = setTimeout(async () => {
        try {
          await loadSelectedOrder(selectedOrderId, { silent: true });
          await loadOrders({ silent: true });
        } catch (e) {
          console.error('Scheduled refresh failed', e);
        } finally {
          refreshTimer.current = null;
        }
      }, 700);
    };

    const refreshFromSocket = async (payload = {}) => {
      if (payload?.id && payload.id !== selectedOrderId) return;

      // Debounce multiple rapid socket events
      scheduleRefresh();
    };

    socket.on("timeline:updated", refreshFromSocket);
    socket.on("order:accepted", refreshFromSocket);
    socket.on("order:in_progress", refreshFromSocket);
    socket.on("order:completed", refreshFromSocket);

    return () => {
      socket.off("timeline:updated", refreshFromSocket);
      socket.off("order:accepted", refreshFromSocket);
      socket.off("order:in_progress", refreshFromSocket);
      socket.off("order:completed", refreshFromSocket);

      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
    };
  }, [selectedOrderId]);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadOrders({ silent: true });
      if (selectedOrderId) {
        await loadSelectedOrder(selectedOrderId, { silent: true });
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleConfirmCompletion() {
    if (!selectedOrder) return;

    setConfirmError("");
    setConfirming(true);

    try {
      await orderService.confirmOrder(selectedOrder.id);

      // Refresh the UI to reflect the confirmed state
      await loadSelectedOrder(selectedOrder.id, { silent: true });
      await loadOrders({ silent: true });
    } catch (err) {
      console.error("Confirm failed", err);
      setConfirmError(
        err?.response?.data?.message || err?.message || "Failed to confirm. Try again."
      );
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content-center">
        <Loader className="spinner" aria-label="Loading orders" />
      </div>
    );
  }

  return (
    <div className="page-content activity-page">
      <section className="activity-heading">
        <div>
          <span className="section-kicker">SERVICE ACTIVITY</span>
          <h1>Track your requests</h1>
          <p>
            Follow each request from creation to completion without needing to
            call the provider.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button activity-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "spin" : ""} />
          Refresh
        </button>
      </section>

      {error && <div className="dashboard-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="card empty-card">
          <div className="empty-icon">
            <PackageCheck size={24} />
          </div>
          <h2>No service requests yet</h2>
          <p>
            Your service requests will appear here once you place your first
            order.
          </p>
        </div>
      ) : (
        <div className="activity-layout">
          <section className="card activity-orders-panel">
            <div className="activity-panel-header">
              <div>
                <span className="section-kicker">YOUR REQUESTS</span>
                <h2>Order history</h2>
              </div>
              <span className="activity-count">{orders.length}</span>
            </div>

            <div className="activity-orders-list">
              {orders.map((order) => {
                const status = normalizeStatus(order.status);
                const active = order.id === selectedOrderId;

                return (
                  <button
                    type="button"
                    key={order.id}
                    className={`activity-order-item ${active ? "active" : ""}`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="activity-order-icon">
                      {status === "COMPLETED" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Truck size={18} />
                      )}
                    </div>

                    <div className="activity-order-copy">
                      <strong>{getOrderTitle(order)}</strong>
                      <span>
                        #{order.id.slice(0, 8)} · {formatDateTime(order.createdAt)}
                      </span>
                    </div>

                    <span className={`status-badge status-${getStatusTone(status)}`}>
                      {STATUS_LABELS[status] || status}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card activity-detail-panel">
            {selectedOrder ? (
              <>
                <div className="activity-detail-header">
                  <div>
                    <span className="section-kicker">ORDER #{selectedOrder.id.slice(0, 8)}</span>
                    <h2>{getOrderTitle(selectedOrder)}</h2>
                    <p>
                      Created {formatDateTime(selectedOrder.createdAt)}
                    </p>
                  </div>

                  <span className={`status-badge status-${statusTone}`}>
                    {STATUS_LABELS[selectedStatus] || selectedStatus}
                  </span>
                </div>

                <div className="activity-summary">
                  <div>
                    <span>Total</span>
                    <strong>{formatCurrency(selectedOrder.total)}</strong>
                  </div>
                  <div>
                    <span>Provider</span>
                    <strong>{selectedOrder.provider?.name || "Assigned provider"}</strong>
                  </div>
                </div>

                <div className="activity-progress">
                  <div className="activity-progress-header">
                    <div>
                      <span className="section-kicker">LIVE PROGRESS</span>
                      <h3>{STATUS_LABELS[selectedStatus] || selectedStatus}</h3>
                    </div>
                    <span className={`progress-state ${statusTone}`}>
                      {selectedStatus === "COMPLETED" ? "Complete" : "In progress"}
                    </span>
                  </div>

                  <p className="activity-status-description">
                    {STATUS_DESCRIPTIONS[selectedStatus] ||
                      "Your request status has been updated."}
                  </p>

                  <div className="status-stepper" aria-label="Order progress">
                    {STATUS_STEPS.map((step) => {
                      const state = getStepState(step, selectedStatus);

                      return (
                        <div className={`status-step ${state}`} key={step}>
                          <div className="status-step-marker">
                            {state === "done" ? <CheckCircle2 size={15} /> : <span />}
                          </div>
                          <span>{STATUS_LABELS[step]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="activity-items">
                  <div className="activity-subheading">
                    <h3>Request details</h3>
                  </div>

                  {selectedItems.map((item) => (
                    <div className="activity-item-row" key={item.id}>
                      <div>
                        <strong>{item.service?.name || "Service"}</strong>
                        <span>Quantity: {item.quantity}</span>
                      </div>
                      <strong>{formatCurrency(Number(item.unitPrice) * Number(item.quantity || 1))}</strong>
                    </div>
                  ))}
                </div>

                <div className="activity-timeline-section">
                  <div className="activity-subheading">
                    <div>
                      <span className="section-kicker">SYNC TIMELINE</span>
                      <h3>What has happened</h3>
                    </div>
                    {timelineLoading && <Loader size={16} className="spinner" />}
                  </div>

                  {timeline.length === 0 ? (
                    <div className="activity-timeline-empty">
                      <Clock3 size={18} />
                      <span>No timeline events have been recorded yet.</span>
                    </div>
                  ) : (
                    <div className="activity-timeline">
                      {timeline.map((event, index) => (
                        <div className="activity-timeline-event" key={event.id || `${event.type}-${index}`}>
                          <div className="timeline-marker">
                            <div className="marker-dot" />
                            {index < timeline.length - 1 && <div className="marker-line" />}
                          </div>

                          <div className="timeline-content">
                            <strong>
                              {STATUS_LABELS[event.type?.replace(/^ORDER_/, "")] ||
                                String(event.type || "System update").replaceAll("_", " ")}
                            </strong>
                            <span>{formatDateTime(event.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedStatus === "COMPLETED" && (
                  <div className="completion-notice">
                    <CheckCircle2 size={19} />
                    <div>
                      <strong>Service completed</strong>
                      <p>
                        The provider has completed this request. The resident can confirm that they have received or accepted the service below.
                      </p>

                      {confirmError && <div className="dashboard-error">{confirmError}</div>}

                      <button
                        type="button"
                        className="primary-button"
                        onClick={handleConfirmCompletion}
                        disabled={confirming}
                      >
                        {confirming ? "Confirming…" : "Confirm completion"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-card">
                <AlertCircle size={30} />
                <h2>Select an order</h2>
                <p>Choose a request from the list to see its progress and timeline.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
