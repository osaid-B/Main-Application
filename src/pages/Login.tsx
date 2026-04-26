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
import { useSettings } from "../context/SettingsContext";
import "./login.css";

export default function Login() {
  const { login } = useAuth();
  const { t, language, setLanguage, isArabic } = useSettings();
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
      setError(t.login.missingCredentials);
      return;
    }

    const success = login(trimmedUsername, trimmedPassword);

    if (success) {
      setError("");
      navigate("/dashboard");
    } else {
      setError(t.login.invalidCredentials);
    }
  };

  return (
    <div className="auth-page" dir={isArabic ? "rtl" : "ltr"}>
      <section className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <BarChart3 size={24} />
            </div>

            <div className="auth-brand-text">
              <p className="auth-brand-label">{t.login.brandLabel}</p>
              <h1 className="auth-brand-title">{t.login.title}</h1>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-row auth-language-row">
              <button
                type="button"
                className={`auth-lang-chip ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                {t.common.english}
              </button>
              <button
                type="button"
                className={`auth-lang-chip ${language === "ar" ? "active" : ""}`}
                onClick={() => setLanguage("ar")}
              >
                {t.common.arabic}
              </button>
            </div>

            <div className="auth-badge">
              <ShieldCheck size={14} />
              {t.login.secureAccess}
            </div>

            <h2 className="auth-heading">{t.login.welcomeBack}</h2>
            <p className="auth-subheading">{t.login.subtitle}</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label" htmlFor="username">
                  {t.login.username}
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">@</span>
                  <input
                    id="username"
                    className="auth-input"
                    type="text"
                    placeholder={t.login.usernamePlaceholder}
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
                    {t.login.password}
                  </label>

                  <button type="button" className="auth-link">
                    {t.login.forgotPassword}
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
                    placeholder={t.login.passwordPlaceholder}
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
                  <span>{t.login.rememberMe}</span>
                </label>

                <div className="auth-trust-inline">
                  <ShieldCheck size={14} />
                  {t.login.trustInline}
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-submit" type="submit">
                <span>{t.login.signIn}</span>
                <ArrowRight size={18} />
              </button>

              <p className="auth-footer-note">{t.login.footerNote}</p>
            </form>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-hero">
          <div className="auth-hero-top">
            <div className="auth-hero-pill">
              <CreditCard size={14} />
              {t.login.rightPill}
            </div>

            <h2 className="auth-hero-title">{t.login.rightTitle}</h2>

            <p className="auth-hero-text">{t.login.rightText}</p>
          </div>

          <div className="auth-features">
            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                <BarChart3 size={20} />
              </div>
              <h3 className="auth-feature-title">{t.login.features.finance.title}</h3>
              <p className="auth-feature-text">{t.login.features.finance.text}</p>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                <Users size={20} />
              </div>
              <h3 className="auth-feature-title">{t.login.features.customers.title}</h3>
              <p className="auth-feature-text">{t.login.features.customers.text}</p>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                <Receipt size={20} />
              </div>
              <h3 className="auth-feature-title">{t.login.features.insights.title}</h3>
              <p className="auth-feature-text">{t.login.features.insights.text}</p>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                <Boxes size={20} />
              </div>
              <h3 className="auth-feature-title">{t.login.features.secure.title}</h3>
              <p className="auth-feature-text">{t.login.features.secure.text}</p>
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
