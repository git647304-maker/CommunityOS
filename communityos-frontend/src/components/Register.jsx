import React, { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import * as authService from "../services/auth.js";

const TENANTS = [
  { id: "green-valley", name: "Green Valley Estate" },
  { id: "sunrise", name: "Sunrise Apartments" },
  { id: "westlands", name: "Westlands Residence" },
];

export default function Register({ onRegistered, onBackToLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Start with NO community selected.
  const [tenantId, setTenantId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await authService.register({
        fullName,
        email,
        phone,
        password,
        tenantId,
      });

      onRegistered();
    } catch (err) {
      console.error(
        "Registration error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* LEFT SIDE */}
      <section className="auth-visual-panel register-visual-panel">
        <div className="auth-visual-content">
          <div className="visual-brand">
            <div className="visual-brand-icon">
              <Building2 size={22} />
            </div>

            <span>
              Community<span>OS</span>
            </span>
          </div>

          <div className="visual-copy">
            <span className="visual-eyebrow">
              JOIN YOUR COMMUNITY
            </span>

            <h1>
              Everything your
              <br />
              community needs.
            </h1>

            <p>
              Create your account and connect with essential
              services, community updates, and trusted providers.
            </p>
          </div>

          <div className="building-scene">
            <div className="scene-cloud cloud-one" />
            <div className="scene-cloud cloud-two" />

            <div className="building building-back">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="building building-main">
              <div className="building-roof" />

              <div className="building-windows">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="building-door" />
            </div>

            <div className="building building-small">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="scene-ground" />

            <div className="scene-tree tree-one">
              <i />
            </div>

            <div className="scene-tree tree-two">
              <i />
            </div>
          </div>

          <div className="visual-benefits">
            <div>
              <CheckCircle2 size={18} />
              <span>Easy service requests</span>
            </div>

            <div>
              <CheckCircle2 size={18} />
              <span>Real-time updates</span>
            </div>

            <div>
              <CheckCircle2 size={18} />
              <span>Connected community</span>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <button
            type="button"
            className="auth-back-button"
            onClick={onBackToLogin}
          >
            <ArrowLeft size={18} />
            Back to sign in
          </button>

          <div className="auth-form-heading">
            <span className="auth-kicker">
              GET STARTED
            </span>

            <h2>Create your account</h2>

            <p>
              Join your community and start accessing essential
              services.
            </p>
          </div>

          {error && (
            <div className="auth-alert">
              {error}
            </div>
          )}

          <form
            className="modern-auth-form"
            onSubmit={handleRegister}
            autoComplete="on"
          >
            {/* FULL NAME */}
            <div className="auth-field">
              <label htmlFor="register-full-name">
                Full Name
              </label>

              <div className="auth-input">
                <User size={19} />

                <input
                  type="text"
                  name="fullName"
                  id="register-full-name"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="auth-field">
              <label htmlFor="register-email">
                Email Address
              </label>

              <div className="auth-input">
                <Mail size={19} />

                <input
                  type="email"
                  name="email"
                  id="register-email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* PHONE */}
            <div className="auth-field">
              <label htmlFor="register-phone">
                Phone Number
              </label>

              <div className="auth-input">
                <Phone size={19} />

                <input
                  type="tel"
                  name="phone"
                  id="register-phone"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+254 700 000 000"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                />
              </div>
            </div>

            {/* COMMUNITY */}
            <div className="auth-field">
              <label htmlFor="register-community">
                Community
              </label>

              <div className="auth-input">
                <Building2 size={19} />

                <select
                  name="community"
                  id="register-community"
                  autoComplete="off"
                  value={tenantId}
                  onChange={(e) =>
                    setTenantId(e.target.value)
                  }
                  required
                >
                  <option value="" disabled>
                    Select your community
                  </option>

                  {TENANTS.map((tenant) => (
                    <option
                      key={tenant.id}
                      value={tenant.id}
                    >
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PASSWORD */}
            <div className="auth-field">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="auth-input">
                <Lock size={19} />

                <input
                  type="password"
                  name="password"
                  id="register-password"
                  autoComplete="new-password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>

          <div className="auth-bottom-text">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onBackToLogin}
            >
              Sign in
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}