import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader,
  Package,
} from "lucide-react";

import * as orderService from "../services/orders.js";
import * as serviceService from "../services/services.js";
import * as communityService from "../services/communities.js";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OrderForm({
  token,
  initialService = null,
  initialProvider = null,
  onCreated,
}) {
  const [services, setServices] = useState([]);
  const [communities, setCommunities] = useState([]);

  const [selectedService, setSelectedService] =
    useState(initialService?.id || "");

  const [selectedCommunity, setSelectedCommunity] =
    useState("");

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] =
    useState(false);

  useEffect(() => {
    setSelectedService(
      initialService?.id || ""
    );
  }, [initialService]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!token) return;

      setLoadingData(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          serviceService.getServices(),
          communityService.getCommunities(),
        ]);

        if (cancelled) return;

        const servicesResult = results[0];
        const communitiesResult = results[1];

        if (servicesResult.status === "fulfilled") {
          const servicesData =
            servicesResult.value || [];

          setServices(servicesData);
        }

        if (
          communitiesResult.status ===
          "fulfilled"
        ) {
          const communitiesData =
            communitiesResult.value || [];

          setCommunities(
            communitiesData
          );

          /*
           * For now we use the first community
           * available to the authenticated user.
           *
           * N/B:
           * Later we should get the resident's
           * actual community directly from their
           * profile/membership instead of allowing
           * arbitrary community selection.
           */
          if (
            communitiesData.length > 0 &&
            !selectedCommunity
          ) {
            setSelectedCommunity(
              communitiesData[0].id
            );
          }
        }

        if (
          servicesResult.status ===
            "rejected" &&
          communitiesResult.status ===
            "rejected"
        ) {
          setError(
            "Unable to load the request form. Please try again."
          );
        }
      } catch (err) {
        console.error(
          "Failed to load request data:",
          err
        );

        if (!cancelled) {
          setError(
            "Failed to load request data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const selectedServiceObject =
    services.find(
      (service) =>
        String(service.id) ===
        String(selectedService)
    ) ||
    initialService ||
    null;

  const provider =
    initialProvider ||
    selectedServiceObject?.provider ||
    null;

  const quantityNumber =
    Math.max(1, Number(quantity) || 1);

  const estimatedTotal =
    Number(
      selectedServiceObject?.unitPrice || 0
    ) * quantityNumber;

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!selectedCommunity) {
      setError(
        "Your community could not be identified."
      );
      return;
    }

    if (!selectedService) {
      setError(
        "Please select a service."
      );
      return;
    }

    if (!selectedServiceObject) {
      setError(
        "The selected service is no longer available."
      );
      return;
    }

    if (!provider?.id) {
      setError(
        "This service does not have a provider assigned yet."
      );
      return;
    }

    setSubmitting(true);

    try {
      const order =
        await orderService.createOrder({
          communityId: selectedCommunity,

          providerId: provider.id,

          items: [
            {
              serviceId: selectedService,
              quantity: quantityNumber,
            },
          ],

          notes:
            notes.trim() || undefined,
        });

      console.log(
        "Order created successfully:",
        order
      );

      onCreated?.(order);
    } catch (err) {
      console.error(
        "Failed to create order:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create your request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="order-form">
      <div className="page-header">
        <span className="section-kicker">
          SERVICE REQUEST
        </span>

        <h1>Request a Service</h1>

        <p>
          Review your request before sending it
          to the service provider.
        </p>
      </div>

      {error && (
        <div
          className="alert alert-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {loadingData ? (
        <div className="page-content-center">
          <Loader className="spinner" />

          <span>
            Loading request details...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="community">
              Community
            </label>

            <select
              id="community"
              value={selectedCommunity}
              onChange={(event) =>
                setSelectedCommunity(
                  event.target.value
                )
              }
              required
            >
              <option value="">
                Select your community
              </option>

              {communities.map(
                (community) => (
                  <option
                    key={community.id}
                    value={community.id}
                  >
                    {community.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="service">
              Service
            </label>

            <select
              id="service"
              value={selectedService}
              onChange={(event) =>
                setSelectedService(
                  event.target.value
                )
              }
              required
            >
              <option value="">
                Select a service
              </option>

              {services.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name} -{" "}
                  {formatCurrency(
                    service.unitPrice
                  )}
                </option>
              ))}
            </select>
          </div>

          {selectedServiceObject && (
            <div className="selected-service">
              <div className="selected-service-icon">
                <Package size={21} />
              </div>

              <div className="selected-service-info">
                <strong>
                  {selectedServiceObject.name}
                </strong>

                <span>
                  {selectedServiceObject.description ||
                    "Community service"}
                </span>

                {provider?.companyName && (
                  <small>
                    Provider:{" "}
                    {provider.companyName}
                  </small>
                )}
              </div>

              <CheckCircle2 size={19} />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="quantity">
              Quantity
            </label>

            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value
                )
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">
              Notes
              <span>Optional</span>
            </label>

            <textarea
              id="notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Add delivery instructions or anything the provider should know..."
              rows="4"
            />
          </div>

          {selectedServiceObject && (
            <div className="order-summary">
              <div>
                <span>Service</span>

                <strong>
                  {selectedServiceObject.name}
                </strong>
              </div>

              <div>
                <span>Quantity</span>

                <strong>
                  {quantityNumber}
                </strong>
              </div>

              <div>
                <span>Estimated total</span>

                <strong>
                  {formatCurrency(
                    estimatedTotal
                  )}
                </strong>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={
              submitting ||
              !selectedService ||
              !selectedCommunity ||
              !provider?.id
            }
          >
            {submitting
              ? "Creating request..."
              : "Submit Service Request"}
          </button>
        </form>
      )}
    </div>
  );
}