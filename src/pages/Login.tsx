import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Eye,
  EyeOff,
  LockKeyhole,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import "./login.css";

export default function Login() {
  const { login } = useAuth();
  const { t, language, setLanguage, isArabic } = useSettings();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError(t.login.missingCredentials);
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 420));

    const success = login(trimmedUsername, trimmedPassword);
    setLoading(false);

    if (success) {
      setError("");
      navigate("/dashboard");
    } else {
      setError(t.login.invalidCredentials);
    }
  };

  return (
    <div className="auth-root" dir={isArabic ? "rtl" : "ltr"}>

      {/* ── Left panel: form ─────────────────────────────────── */}
      <section className="auth-panel auth-panel--form">
        <div className="auth-form-container">

          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <BarChart3 size={18} />
            </div>
            <span className="auth-logo-label">{t.login.brandLabel}</span>
          </div>

          {/* Heading */}
          <div className="auth-intro">
            <h1 className="auth-intro-title">{t.login.welcomeBack}</h1>
            <p className="auth-intro-sub">{t.login.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>

            <div className="auth-field">
              <label className="auth-label" htmlFor="username">
                {t.login.username}
              </label>
              <div className={`auth-input-wrap ${error && !username ? "auth-input-wrap--error" : ""}`}>
                <span className="auth-input-prefix">@</span>
                <input
                  id="username"
                  className="auth-input"
                  type="text"
                  placeholder={t.login.usernamePlaceholder}
                  value={username}
                  autoComplete="username"
                  autoFocus
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label className="auth-label" htmlFor="password">
                  {t.login.password}
                </label>
                <button type="button" className="auth-link">{t.login.forgotPassword}</button>
              </div>
              <div className={`auth-input-wrap ${error && !password ? "auth-input-wrap--error" : ""}`}>
                <span className="auth-input-prefix">
                  <LockKeyhole size={15} />
                </span>
                <input
                  id="password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.login.passwordPlaceholder}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>{t.login.rememberMe}</span>
              </label>
              <div className="auth-trust">
                <ShieldCheck size={13} />
                <span>{t.login.trustInline}</span>
              </div>
            </div>

            {error && (
              <div className="auth-error-box">
                <span>{error}</span>
              </div>
            )}

            <button
              className={`auth-submit-btn ${loading ? "auth-submit-btn--loading" : ""}`}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <span>{t.login.signIn}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="auth-footer-note">{t.login.footerNote}</p>
            <div className="auth-lang-toggle">
              <button
                type="button"
                className={`auth-lang-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
              <div className="auth-lang-divider" />
              <button
                type="button"
                className={`auth-lang-btn ${language === "ar" ? "active" : ""}`}
                onClick={() => setLanguage("ar")}
              >
                AR
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Right panel: visual showcase ─────────────────────── */}
      <section className="auth-panel auth-panel--showcase">
        <div className="auth-showcase">

          <div className="auth-showcase-copy">
            <div className="auth-showcase-pill">
              <ShieldCheck size={12} />
              <span>{t.login.rightPill}</span>
            </div>
            <h2 className="auth-showcase-title">{t.login.rightTitle}</h2>
            <p className="auth-showcase-sub">{t.login.rightText}</p>
          </div>

          <div className="auth-showcase-stats">
            <div className="auth-stat">
              <div className="auth-stat-icon auth-stat-icon--blue">
                <BarChart3 size={16} />
              </div>
              <div className="auth-stat-body">
                <span className="auth-stat-value">$48,240</span>
                <span className="auth-stat-label">Revenue this month</span>
              </div>
              <div className="auth-stat-delta">↑ 12.4%</div>
            </div>

            <div className="auth-stat">
              <div className="auth-stat-icon auth-stat-icon--indigo">
                <Users size={16} />
              </div>
              <div className="auth-stat-body">
                <span className="auth-stat-value">1,284</span>
                <span className="auth-stat-label">Active customers</span>
              </div>
            </div>

            <div className="auth-stat">
              <div className="auth-stat-icon auth-stat-icon--green">
                <Receipt size={16} />
              </div>
              <div className="auth-stat-body">
                <span className="auth-stat-value">324</span>
                <span className="auth-stat-label">Invoices issued</span>
              </div>
            </div>

            <div className="auth-stat">
              <div className="auth-stat-icon auth-stat-icon--amber">
                <Boxes size={16} />
              </div>
              <div className="auth-stat-body">
                <span className="auth-stat-value">98%</span>
                <span className="auth-stat-label">Inventory health</span>
              </div>
            </div>
          </div>

          <div className="auth-chart">
            <div className="auth-chart-header">
              <span className="auth-chart-label">Cash flow</span>
              <span className="auth-chart-period">Last 8 periods</span>
            </div>
            <div className="auth-chart-bars">
              {[42, 58, 48, 70, 56, 78, 66, 84].map((h, i) => (
                <div
                  key={i}
                  className="auth-chart-bar"
                  style={{ "--bar-h": `${h}%` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
