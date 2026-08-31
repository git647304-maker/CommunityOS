import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Droplets,
  Flame,
  Package,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";

import { getServices } from "../services.js";

const ICONS = {
  water: Droplets,
  gas: Flame,
  electricity: Zap,
  maintenance: Wrench,
  security: ShieldCheck,
};

function getIcon(service) {
  const value = String(
    service?.slug || service?.name || ""
  ).toLowerCase();

  const key = Object.keys(ICONS).find((item) =>
    value.includes(item)
  );

  return ICONS[key] || Package;
}

export default function ServicesSelect({
  token,
  value,
  onChange,
  onContinue,
}) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadServices() {
      try {
        setLoading(true);
        setError("");

        const response = await getServices({
          active: true,
        });

        if (!mounted) return;

        const data =
          response?.data?.data ||
          response?.data?.services ||
          response?.data ||
          [];

        setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) {
          setError(
            err?.message ||
              "Unable to load services."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (token) {
      loadServices();
    }

    return () => {
      mounted = false;
    };
  }, [token]);

  function handleSelect(event) {
    const serviceId = event.target.value;

    const selectedService =
      services.find(
        (service) =>
          String(service.id) === String(serviceId)
      ) || null;

    onChange?.(selectedService);
  }

  const selectedId = value?.id || "";

  return (
    <div className="service-select">
      <div className="form-field">
        <label htmlFor="service">
          Select a service
        </label>

        <div className="select-wrapper">
          <select
            id="service"
            value={selectedId}
            onChange={handleSelect}
            disabled={loading || !!error}
          >
            <option value="">
              {loading
                ? "Loading services..."
                : "Choose a service"}
            </option>

            {services.map((service) => (
              <option
                key={service.id}
                value={service.id}
              >
                {service.name ||
                  service.title ||
                  "Community service"}
              </option>
            ))}
          </select>

          <ChevronDown size={18} />
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {value && (
        <div className="selected-service">
          <div className="selected-service-icon">
            {(() => {
              const Icon = getIcon(value);
              return <Icon size={21} />;
            })()}
          </div>

          <div className="selected-service-info">
            <strong>
              {value.name ||
                value.title ||
                "Selected service"}
            </strong>

            <span>
              {value.description ||
                "Service selected successfully."}
            </span>
          </div>

          <div className="selected-check">
            <Check size={16} />
          </div>
        </div>
      )}

      <button
        type="button"
        className="primary-button"
        disabled={!value || loading}
        onClick={onContinue}
      >
        Continue
        <ArrowRight size={17} />
      </button>
    </div>
  );
}