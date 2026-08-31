import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Droplet,
  Flame,
  Loader,
  Package,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";

import * as serviceService from "../services/services.js";
import * as providerService from "../services/providers.js";

const SERVICE_ICONS = {
  water: Droplet,
  gas: Flame,
  electricity: Zap,
  maintenance: Wrench,
  security: ShieldCheck,
};

function getServiceIcon(service) {
  const value = String(
    service?.serviceType ||
      service?.slug ||
      service?.name ||
      ""
  ).toLowerCase();

  const key = Object.keys(SERVICE_ICONS).find((item) =>
    value.includes(item)
  );

  return SERVICE_ICONS[key] || Package;
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Services({ token, onRequest }) {
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadServices() {
      if (!token) return;

      try {
        setLoading(true);
        setError("");

        const [servicesData, providersData] =
          await Promise.all([
            serviceService.getServices(),
            providerService.getProviders(),
          ]);

        if (!mounted) return;

        setServices(
          Array.isArray(servicesData)
            ? servicesData
            : []
        );

        setProviders(
          Array.isArray(providersData)
            ? providersData
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load services:",
          err
        );

        if (mounted) {
          setError(
            err?.response?.data?.message ||
              "Unable to load services. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      mounted = false;
    };
  }, [token]);

  function handleRequest(service) {
    const provider =
      service?.provider ||
      providers.find(
        (item) => item.id === service?.providerId
      ) ||
      null;

    /*
     * Pass the actual selected service and provider
     * to the request flow.
     *
     * This prevents the order form from guessing
     * which service the resident wanted.
     */
    onRequest?.({
      service,
      provider,
    });
  }

  if (loading) {
    return (
      <div className="page-content-center">
        <Loader className="spinner" />
      </div>
    );
  }

  return (
    <div className="services-page">
      <div className="page-header">
        <span className="section-kicker">
          COMMUNITY SERVICES
        </span>

        <h1>Available Services</h1>

        <p>
          Request essential services from providers
          serving your community.
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

      {!error && services.length === 0 && (
        <div className="empty-state">
          <AlertCircle size={40} />

          <p>No services are currently available.</p>
        </div>
      )}

      {services.length > 0 && (
        <div className="services-grid">
          {services.map((service) => {
            const Icon = getServiceIcon(service);

            const provider =
              service?.provider ||
              providers.find(
                (item) =>
                  item.id === service?.providerId
              );

            return (
              <article
                key={service.id}
                className="service-card"
              >
                <div className="service-icon">
                  <Icon size={30} />
                </div>

                <div className="service-card-content">
                  <div className="service-card-heading">
                    <div>
                      <h3>
                        {service.name ||
                          "Community Service"}
                      </h3>

                      {service.serviceType && (
                        <span className="service-type">
                          {String(
                            service.serviceType
                          ).replaceAll("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="service-description">
                    {service.description ||
                      "Available community service."}
                  </p>

                  <div className="service-provider">
                    <span>Provider</span>

                    <strong>
                      {provider?.companyName ||
                        "Available provider"}
                    </strong>
                  </div>

                  <div className="service-footer">
                    <div>
                      <span className="service-price-label">
                        From
                      </span>

                      <strong className="service-price">
                        {formatCurrency(
                          service.unitPrice
                        )}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() =>
                        handleRequest(service)
                      }
                    >
                      Request
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}