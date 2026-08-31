import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Droplets,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Wrench,
} from "lucide-react";
import * as authService from "../services/auth.js";
import "../styles/auth.css";

const TENANTS = [
  { id: "green-valley", name: "Green Valley Estate" },
  { id: "sunrise", name: "Sunrise Apartments" },
  { id: "westlands", name: "Westlands Residence" },
];

const FLOATING_SERVICES = [
  {
    icon: Droplets,
    label: "Water Delivery",
  },
  {
    icon: Trash2,
    label: "Waste Collection",
  },
  {
    icon: Wrench,
    label: "Maintenance",
  },
];

function getInitialTheme() {
  const savedTheme = localStorage.getItem("communityos-auth-theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Green Valley remains the default community for LOGIN.
  const [tenantId, setTenantId] = useState("green-valley");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem("communityos-auth-theme", theme);
    document.documentElement.dataset.authTheme = theme;
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await authService.login(
        email,
        password,
        tenantId
      );

      onLogin(result);
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          "Login failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const isDark = theme === "dark";

  return (
    <main className={`auth-page ${isDark ? "auth-dark" : "auth-light"}`}>
      {/* =====================================================
          THEME BUTTON
          ===================================================== */}
      <button
        type="button"
        className="auth-theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}

        <span>{isDark ? "Light" : "Dark"}</span>
      </button>

      {/* =====================================================
          LEFT SHOWCASE
          ===================================================== */}
      <section className="auth-showcase">
        <div className="auth-background-glow auth-glow-one" />
        <div className="auth-background-glow auth-glow-two" />
        <div className="auth-showcase-grid" />

        {/* BRAND */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Building2 size={22} />
          </div>

          <span>
            Community<span>OS</span>
          </span>
        </div>

        {/* MAIN CONTENT */}
        <div className="auth-showcase-content">
          <div className="auth-showcase-copy">
            <div className="auth-eyebrow">
              <Sparkles size={15} />
              SMART COMMUNITY PLATFORM
            </div>

            <h1>
              Empowering
              <br />
              <span>Communities,</span>
              <br />
              together.
            </h1>

            <p>
              The intelligent way to manage, connect, and
              grow your community.
            </p>

            <div className="auth-copy-line" />
          </div>

          {/* FLOATING SERVICES */}
          <div
            className="auth-floating-services"
            aria-label="Community services"
          >
            {FLOATING_SERVICES.map(
              ({ icon: Icon, label }, index) => (
                <div
                  className={`auth-float auth-float-${index + 1}`}
                  key={label}
                >
                  <div className="auth-float-icon">
                    <Icon size={24} strokeWidth={1.8} />
                  </div>

                  <span>{label}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* TRUST */}
        <div className="auth-trust">
          <p>
            Great communities are built on trust,
            communication, and great technology.
          </p>

          <div className="auth-trust-bottom">
            <div className="auth-avatars">
              {["A", "J", "M", "K"].map((letter) => (
                <span key={letter}>{letter}</span>
              ))}
            </div>

            <div>
              Trusted by <strong>300+</strong> communities
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RIGHT LOGIN PANEL
          ===================================================== */}
      <section className="auth-form-panel">
        <div className="auth-panel-brand">
          <div className="auth-panel-brand-icon">
            <Building2 size={17} />
          </div>

          <span>
            Community<span>OS</span>
          </span>
        </div>

        <div className="auth-form-wrap">
          {/* HEADING */}
          <div className="auth-form-heading">
            <span className="auth-kicker">WELCOME BACK</span>

            <h2>Sign in to your community</h2>

            <p>
              Access your services, requests, updates,
              and community workspace.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="auth-alert auth-alert-error">
              {error}
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleLogin}
            className="auth-modern-form"
            autoComplete="on"
          >
            {/* COMMUNITY */}
            <label className="auth-field">
              <span>Community</span>

              <div className="auth-control">
                <Building2 size={18} />

                <select
                  name="community"
                  id="login-community"
                  autoComplete="off"
                  value={tenantId}
                  onChange={(event) =>
                    setTenantId(event.target.value)
                  }
                  required
                >
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
            </label>

            {/* EMAIL */}
            <label className="auth-field">
              <span>Email address</span>

              <div className="auth-control">
                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  id="login-email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </div>
            </label>

            {/* PASSWORD */}
            <label className="auth-field">
              <span>Password</span>

              <div className="auth-control">
                <Lock size={18} />

                <input
                  type="password"
                  name="password"
                  id="login-password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />
              </div>
            </label>

            {/* SUBMIT */}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              <span>
                {loading ? "Signing in..." : "Sign In"}
              </span>

              <ArrowRight size={18} />
            </button>
          </form>

          {/* DEMO CREDENTIALS */}
          <div className="auth-demo-card">
            <div className="auth-demo-title">
              <ShieldCheck size={17} />
              <span>Demo Credentials</span>
            </div>

            <div className="auth-demo-row">
              <strong>Resident</strong>
              <span>resident@example.com</span>
              <b>/</b>
              <span>resident123</span>
            </div>

            <div className="auth-demo-row">
              <strong>Provider</strong>
              <span>aquaflow@provider.com</span>
              <b>/</b>
              <span>provider123</span>
            </div>

            <div className="auth-demo-row">
              <strong>Manager</strong>
              <span>manager@greenvally.com</span>
              <b>/</b>
              <span>manager123</span>
            </div>
          </div>

          {/* REGISTER */}
          <div className="auth-switch-copy">
            <span>New to CommunityOS?</span>

            <button
              type="button"
              onClick={onRegister}
            >
              Create an account
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}


