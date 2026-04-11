import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CreditCard,
  LockKeyhole,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Please enter username and password");
      return;
    }

    const success = login(trimmedUsername, trimmedPassword);

    if (success) {
      setError("");
      navigate("/dashboard");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <BarChart3 size={24} />
            </div>

            <div className="auth-brand-text">
              <p className="auth-brand-label">Business Dashboard</p>
              <h1 className="auth-brand-title">Sign in to your workspace</h1>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-badge">
              <ShieldCheck size={14} />
              Secure access for authorized business users
            </div>

            <h2 className="auth-heading">Welcome back</h2>
            <p className="auth-subheading">
              Access your accounting, customers, invoices, payments, inventory,
              and purchases from one modern control center.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label" htmlFor="username">
                  Email or username
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">@</span>
                  <input
                    id="username"
                    className="auth-input"
                    type="text"
                    placeholder="you@company.com"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-row">
                  <label className="auth-label" htmlFor="password">
                    Password
                  </label>

                  <button type="button" className="auth-link">
                    Forgot password?
                  </button>
                </div>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <LockKeyhole size={16} />
                  </span>
                  <input
                    id="password"
                    className="auth-input"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="auth-row">
                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <div className="auth-trust-inline">
                  <ShieldCheck size={14} />
                  Protected with enterprise-grade access control
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-submit" type="submit">
                <span>Sign in</span>
                <ArrowRight size={18} />
              </button>

              <p className="auth-footer-note">
                By continuing, you agree to secure usage policies for authorized
                teams, finance staff, and business operators.
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-hero">
          <div className="auth-hero-top">
            <div className="auth-hero-pill">
              <CreditCard size={14} />
              Built for finance teams, operators, and growing businesses
            </div>

            <h2 className="auth-hero-title">
              Manage your business with clarity, speed, and control.
            </h2>

            <p className="auth-hero-text">
              Track invoices, customers, payments, purchases, and inventory in
              one smart dashboard designed for accounting workflows and modern
              business operations.
            </p>
          </div>

          <div className="auth-features">
            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                <BarChart3 size={20} />
              </div>
              <h3 className="auth-feature-title">Real-time financial tracking</h3>
              <p className="auth-feature-text">
                Monitor revenue, outstanding invoices, payment flow, and
                operational metrics in one unified view.
              </p>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                <Users size={20} />
              </div>
              <h3 className="auth-feature-title">Customer & invoice management</h3>
              <p className="auth-feature-text">
                Organize clients, billing records, notes, and invoice history
                with clean, structured workflows.
              </p>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                <Receipt size={20} />
              </div>
              <h3 className="auth-feature-title">Smart reporting and insights</h3>
              <p className="auth-feature-text">
                Turn daily business activity into clear summaries, trends, and
                decisions your team can act on.
              </p>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                <Boxes size={20} />
              </div>
              <h3 className="auth-feature-title">Secure and modern workflow</h3>
              <p className="auth-feature-text">
                A trustworthy interface built for authorized teams handling
                finance, purchases, and internal operations.
              </p>
            </div>
          </div>

          <div className="auth-preview">
            <div className="auth-preview-header">
              <div>
                <div className="auth-preview-label">Live overview</div>
                <h3 className="auth-preview-title">Business performance</h3>
              </div>

              <div className="auth-preview-status">Synced</div>
            </div>

            <div className="auth-preview-grid">
              <div className="auth-mini-card">
                <div className="auth-mini-label">Revenue</div>
                <div className="auth-mini-value">$48,240</div>
                <div className="auth-mini-note">+12.4% this month</div>
              </div>

              <div className="auth-mini-card">
                <div className="auth-mini-label">Outstanding invoices</div>
                <div className="auth-mini-value">18</div>
                <div className="auth-mini-note">Need follow-up</div>
              </div>
            </div>

            <div className="auth-chart-card">
              <div className="auth-chart-top">
                <div>
                  <div className="auth-chart-meta">Cash flow</div>
                  <div className="auth-chart-title">Last 8 periods</div>
                </div>

                <BarChart3 size={18} color="#0369a1" />
              </div>

              <div className="auth-chart-bars">
                {[38, 52, 46, 68, 58, 76, 64, 82].map((height, index) => (
                  <div
                    key={index}
                    className="auth-chart-bar"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="auth-stats-row">
              <div className="auth-stat-box">
                <div className="auth-stat-icon sky">
                  <Users size={16} />
                </div>
                <div className="auth-stat-label">Customers</div>
                <div className="auth-stat-value">1,284</div>
              </div>

              <div className="auth-stat-box">
                <div className="auth-stat-icon indigo">
                  <Receipt size={16} />
                </div>
                <div className="auth-stat-label">Invoices</div>
                <div className="auth-stat-value">324</div>
              </div>

              <div className="auth-stat-box">
                <div className="auth-stat-icon green">
                  <Boxes size={16} />
                </div>
                <div className="auth-stat-label">Inventory</div>
                <div className="auth-stat-value">98%</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}