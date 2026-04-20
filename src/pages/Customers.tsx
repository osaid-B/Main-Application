import { useEffect, useMemo, useRef, useState } from "react";
import "./Customers.css";
import type { Customer } from "../data/types";
import { getCustomers, saveCustomers } from "../data/storage";

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  location: string;
  notes: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
};

type PendingCloseTarget = "add" | "edit" | null;
type SortKey = "id" | "name" | "email" | "phone" | "joinedAt";
type SortDirection = "asc" | "desc";
type DetailsTab =
  | "overview"
  | "purchases"
  | "payments"
  | "notes"
  | "activity";

type PurchaseStatus = "Paid" | "Partial" | "Unpaid" | "Cancelled";
type PaymentMethod = "Cash" | "Bank Transfer" | "Card" | "Wallet";

type CustomerPurchase = {
  id: string;
  customerId: string;
  invoiceNo: string;
  date: string;
  products: string[];
  quantity: number;
  total: number;
  status: PurchaseStatus;
};

type CustomerPayment = {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  recordedBy: string;
};

type CustomerNoteItem = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

type CustomerActivity = {
  id: string;
  type: "created" | "updated" | "purchase" | "payment" | "note";
  title: string;
  description: string;
  date: string;
};

const emptyForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  location: "",
  notes: "",
};

const DELETE_CONFIRMATION_CODE = "123";
const NOTE_PREVIEW_LIMIT = 220;

const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "msn.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "mail.com",
  "zoho.com",
  "gmx.com",
  "yandex.com",
  "fastmail.com",
  "me.com",
  "pm.me",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "daum.net",
  "rediffmail.com",
  "inbox.com",
];

const PALESTINIAN_LOCATIONS = [
  {
    group: "Inside 1948 (الداخل المحتل)",
    items: [
      { en: "Jerusalem", ar: "القدس" },
      { en: "Nazareth", ar: "الناصرة" },
      { en: "Umm al-Fahm", ar: "أم الفحم" },
      { en: "Haifa", ar: "حيفا" },
      { en: "Jaffa", ar: "يافا" },
      { en: "Lod", ar: "اللد" },
      { en: "Ramla", ar: "الرملة" },
      { en: "Acre", ar: "عكا" },
      { en: "Sakhnin", ar: "سخنين" },
      { en: "Tira", ar: "الطيرة" },
      { en: "Tayibe", ar: "الطيبة" },
      { en: "Kafr Qasim", ar: "كفر قاسم" },
      { en: "Rahat", ar: "رهط" },
      { en: "Tamra", ar: "طمرة" },
    ],
  },
  {
    group: "West Bank (الضفة الغربية)",
    items: [
      { en: "Jerusalem", ar: "القدس" },
      { en: "Ramallah", ar: "رام الله" },
      { en: "al-Bireh", ar: "البيرة" },
      { en: "Nablus", ar: "نابلس" },
      { en: "Jenin", ar: "جنين" },
      { en: "Tulkarm", ar: "طولكرم" },
      { en: "Qalqilya", ar: "قلقيلية" },
      { en: "Salfit", ar: "سلفيت" },
      { en: "Jericho", ar: "أريحا" },
      { en: "Bethlehem", ar: "بيت لحم" },
      { en: "Hebron", ar: "الخليل" },
      { en: "Tubas", ar: "طوباس" },
    ],
  },
  {
    group: "Gaza Strip (قطاع غزة)",
    items: [
      { en: "Gaza", ar: "غزة" },
      { en: "Jabalia", ar: "جباليا" },
      { en: "Beit Lahia", ar: "بيت لاهيا" },
      { en: "Beit Hanoun", ar: "بيت حانون" },
      { en: "Deir al-Balah", ar: "دير البلح" },
      { en: "Khan Younis", ar: "خان يونس" },
      { en: "Rafah", ar: "رفح" },
    ],
  },
];

function isValidPhone(phone: string) {
  return /^(059|056)\d{7}$/.test(phone);
}

function isValidEmail(email: string) {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailSuggestions(input: string) {
  const value = input.trim().toLowerCase();
  if (!value) return [];

  const hasAt = value.includes("@");
  const [localPart, domainPartRaw = ""] = value.split("@");
  const domainPart = domainPartRaw.trim();

  if (!localPart.trim()) return [];

  if (!hasAt) {
    return COMMON_EMAIL_DOMAINS.slice(0, 10).map(
      (domain) => `${localPart}@${domain}`
    );
  }

  return COMMON_EMAIL_DOMAINS.filter((domain) => domain.startsWith(domainPart))
    .slice(0, 10)
    .map((domain) => `${localPart}@${domain}`);
}

function formatCurrency(value: number) {
  return `₪${Number(value || 0).toLocaleString()}`;
}

function getCustomerSeed(customer: Customer) {
  const raw = String(customer?.id || customer?.name || "0");
  return raw.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function generateCustomerPurchases(customer: Customer): CustomerPurchase[] {
  const seed = getCustomerSeed(customer);
  const statuses: PurchaseStatus[] = ["Paid", "Partial", "Unpaid", "Cancelled"];
  const productSets = [
    ["Water Tank", "Filter Set"],
    ["PVC Pipes", "Valve"],
    ["Solar Heater", "Pressure Kit"],
    ["Cement Bags", "Paint Buckets"],
    ["Electrical Wires", "Switches"],
  ];

  const count = (seed % 4) + 3;

  return Array.from({ length: count }, (_, index) => {
    const quantity = ((seed + index) % 8) + 1;
    const price = 120 + ((seed + index * 37) % 450);
    const total = quantity * price;
    const status = statuses[(seed + index) % statuses.length];
    const products = productSets[(seed + index) % productSets.length];

    return {
      id: `PUR-${customer.id}-${index + 1}`,
      customerId: customer.id,
      invoiceNo: `INV-${2000 + index + (seed % 500)}`,
      date: new Date(
        Date.now() - (index + 1) * 1000 * 60 * 60 * 24 * 9
      )
        .toISOString()
        .split("T")[0],
      products,
      quantity,
      total,
      status,
    };
  });
}

function generateCustomerPayments(
  customer: Customer,
  purchases: CustomerPurchase[]
): CustomerPayment[] {
  const seed = getCustomerSeed(customer);
  const methods: PaymentMethod[] = ["Cash", "Bank Transfer", "Card", "Wallet"];

  return purchases
    .slice(0, Math.max(2, purchases.length - 1))
    .map((purchase, index) => {
      const ratio =
        purchase.status === "Paid"
          ? 1
          : purchase.status === "Partial"
          ? 0.55
          : purchase.status === "Cancelled"
          ? 0
          : 0.25;

      const amount = Math.round(purchase.total * ratio);

      return {
        id: `PAY-${customer.id}-${index + 1}`,
        customerId: customer.id,
        date: new Date(
          new Date(purchase.date).getTime() + 1000 * 60 * 60 * 24 * 2
        )
          .toISOString()
          .split("T")[0],
        amount,
        method: methods[(seed + index) % methods.length],
        reference: `REF-${7000 + seed + index}`,
        recordedBy: index % 2 === 0 ? "Admin User" : "Sales Employee",
      };
    });
}

function generateCustomerNotes(customer: Customer): CustomerNoteItem[] {
  const baseNote = customer.notes?.trim();
  const notes: CustomerNoteItem[] = [];

  if (baseNote) {
    notes.push({
      id: `NOTE-${customer.id}-1`,
      text: baseNote,
      author: "System Import",
      createdAt: customer.joinedAt || new Date().toISOString().split("T")[0],
    });
  }

  notes.push(
    {
      id: `NOTE-${customer.id}-2`,
      text: "Customer prefers quick phone follow-up before confirming the order.",
      author: "Sales Team",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12)
        .toISOString()
        .split("T")[0],
    },
    {
      id: `NOTE-${customer.id}-3`,
      text: "Requested invoice copy and product warranty details.",
      author: "Accounts",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
        .toISOString()
        .split("T")[0],
    }
  );

  return notes;
}

function generateCustomerActivity(
  customer: Customer,
  purchases: CustomerPurchase[],
  payments: CustomerPayment[],
  notes: CustomerNoteItem[]
): CustomerActivity[] {
  const activity: CustomerActivity[] = [
    {
      id: `ACT-${customer.id}-created`,
      type: "created",
      title: "Customer created",
      description: `Customer profile for ${customer.name} was created.`,
      date: customer.joinedAt || new Date().toISOString().split("T")[0],
    },
    {
      id: `ACT-${customer.id}-updated`,
      type: "updated",
      title: "Customer profile updated",
      description: "Basic contact details were updated.",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8)
        .toISOString()
        .split("T")[0],
    },
  ];

  purchases.forEach((purchase) => {
    activity.push({
      id: `ACT-${purchase.id}`,
      type: "purchase",
      title: `Invoice ${purchase.invoiceNo} created`,
      description: `${purchase.quantity} item(s) • ${formatCurrency(
        purchase.total
      )} • ${purchase.status}`,
      date: purchase.date,
    });
  });

  payments.forEach((payment) => {
    activity.push({
      id: `ACT-${payment.id}`,
      type: "payment",
      title: "Payment recorded",
      description: `${formatCurrency(payment.amount)} via ${payment.method}`,
      date: payment.date,
    });
  });

  notes.forEach((note) => {
    activity.push({
      id: `ACT-${note.id}`,
      type: "note",
      title: `Note added by ${note.author}`,
      description: note.text,
      date: note.createdAt,
    });
  });

  return activity.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function getCustomerDetailsData(customer: Customer) {
  const purchases = generateCustomerPurchases(customer);
  const payments = generateCustomerPayments(customer, purchases);
  const notes = generateCustomerNotes(customer);
  const activity = generateCustomerActivity(customer, purchases, payments, notes);

  const totalInvoices = purchases.length;
  const totalOrders = purchases.length;
  const totalPurchases = purchases
    .filter((purchase) => purchase.status !== "Cancelled")
    .reduce((sum, purchase) => sum + purchase.total, 0);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceDue = Math.max(totalPurchases - totalPaid, 0);
  const averageOrderValue = totalOrders ? totalPurchases / totalOrders : 0;
  const lastPurchase = purchases[0] || null;
  const lastNote = notes[notes.length - 1] || notes[0] || null;

  return {
    purchases,
    payments,
    notes,
    activity,
    overview: {
      totalInvoices,
      totalOrders,
      totalPurchases,
      totalPaid,
      balanceDue,
      averageOrderValue,
      lastPurchase,
      lastNote,
    },
  };
}

function getStatusBadge(balanceDue: number, totalPurchases: number) {
  if (balanceDue > 0) {
    return { label: "Debtor", className: "status-badge warning" };
  }

  if (totalPurchases > 3000) {
    return { label: "VIP", className: "status-badge success" };
  }

  return { label: "Active", className: "status-badge info" };
}

function EmailInput({
  value,
  onChange,
  error,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(() => buildEmailSuggestions(value), [value]);

  const shouldShowSuggestions =
    isOpen && value.trim() !== "" && suggestions.length > 0;

  return (
    <div style={{ position: "relative" }}>
      <input
        className="modal-input"
        type="email"
        placeholder={placeholder || "Enter email address (Optional)"}
        value={value}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 150);
        }}
        onChange={(e) => onChange(e.target.value)}
      />

      {shouldShowSuggestions && (
        <div className="field-dropdown">
          <div className="dropdown-title">Suggested email addresses</div>

          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="dropdown-option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(suggestion);
                setIsOpen(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function LocationSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return PALESTINIAN_LOCATIONS;

    return PALESTINIAN_LOCATIONS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.en.toLowerCase().includes(term) ||
          item.ar.toLowerCase().includes(term) ||
          `${item.en} (${item.ar})`.toLowerCase().includes(term)
      ),
    })).filter((group) => group.items.length > 0);
  }, [search]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="modal-input"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          background: "#fff",
          userSelect: "none",
        }}
      >
        <span style={{ color: value ? "#1e293b" : "#94a3b8" }}>
          {value || "Select city / area"}
        </span>

        <span style={{ fontSize: "14px", color: "#64748b", marginLeft: "12px" }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="field-dropdown" style={{ zIndex: 60 }}>
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid #edf2f7",
              background: "#f8fbff",
            }}
          >
            <input
              className="modal-input"
              type="text"
              placeholder="Search city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>

          <div style={{ maxHeight: "280px", overflowY: "auto", padding: "8px" }}>
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div key={group.group} style={{ marginBottom: "8px" }}>
                  <div
                    style={{
                      padding: "8px 10px",
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#64748b",
                    }}
                  >
                    {group.group}
                  </div>

                  {group.items.map((item) => {
                    const fullLabel = `${item.en} (${item.ar})`;

                    return (
                      <button
                        key={`${group.group}-${item.en}-${item.ar}`}
                        type="button"
                        className="dropdown-option"
                        onClick={() => {
                          onChange(fullLabel);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        style={{
                          background: value === fullLabel ? "#eff6ff" : "transparent",
                          fontWeight: value === fullLabel ? 700 : 600,
                        }}
                      >
                        {fullLabel}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "16px 14px",
                  color: "#64748b",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                No matching city found.
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function ConfirmCloseModal({
  open,
  onKeepEditing,
  onDiscard,
  title,
  description,
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  title: string;
  description: string;
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onKeepEditing}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px" }}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <button className="modal-close-btn" onClick={onKeepEditing}>
            ×
          </button>
        </div>

        <div className="unsaved-warning-box">
          You have unsaved changes. If you close now, the entered data will be
          lost.
        </div>

        <div className="modal-actions" style={{ marginTop: "22px" }}>
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={onKeepEditing}
          >
            Continue Editing
          </button>

          <button
            type="button"
            className="quick-action-btn discard-btn"
            onClick={onDiscard}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailsModal({
  customer,
  onClose,
  onEdit,
}: {
  customer: Customer | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailsTab>("overview");

  const details = useMemo(() => {
    if (!customer) return null;
    return getCustomerDetailsData(customer);
  }, [customer]);

  useEffect(() => {
    setActiveTab("overview");
  }, [customer]);

  if (!customer || !details) return null;

  const { purchases, payments, notes, activity, overview } = details;
  const status = getStatusBadge(overview.balanceDue, overview.totalPurchases);

  const tabs: { key: DetailsTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "purchases", label: "Purchases History" },
    { key: "payments", label: "Payments" },
    { key: "notes", label: "Notes" },
    { key: "activity", label: "Activity Timeline" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card customer-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="customer-profile-header">
          <div className="customer-profile-main">
            <div className="customer-avatar">
              {(customer.name || "C").charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="customer-profile-topline">
                <h2>{customer.name}</h2>
                <span className={status.className}>{status.label}</span>
              </div>

              <p className="customer-profile-subtitle">
                {customer.id} • Joined {customer.joinedAt || "-"}
              </p>

              <div className="customer-contact-inline">
                <span>{customer.phone}</span>
                <span>{customer.email || "No email"}</span>
                <span>{customer.location || "No location"}</span>
              </div>
            </div>
          </div>

          <div className="customer-profile-actions">
            <button className="quick-action-btn secondary" onClick={onEdit}>
              Edit
            </button>

            <button className="modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="customer-kpi-grid">
          <div className="customer-kpi-card">
            <span>Total Purchases</span>
            <strong>{formatCurrency(overview.totalPurchases)}</strong>
          </div>

          <div className="customer-kpi-card">
            <span>Total Paid</span>
            <strong>{formatCurrency(overview.totalPaid)}</strong>
          </div>

          <div className="customer-kpi-card">
            <span>Balance Due</span>
            <strong>{formatCurrency(overview.balanceDue)}</strong>
          </div>

          <div className="customer-kpi-card">
            <span>Average Order</span>
            <strong>{formatCurrency(overview.averageOrderValue)}</strong>
          </div>
        </div>

        <div className="customer-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`customer-tab-btn ${
                activeTab === tab.key ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="customer-tab-content">
          {activeTab === "overview" && (
            <div className="customer-details-grid">
              <div className="customer-section-card">
                <h3>General Summary</h3>
                <div className="summary-list">
                  <div>
                    <span>Total Invoices</span>
                    <strong>{overview.totalInvoices}</strong>
                  </div>
                  <div>
                    <span>Total Orders</span>
                    <strong>{overview.totalOrders}</strong>
                  </div>
                  <div>
                    <span>Average Order Value</span>
                    <strong>{formatCurrency(overview.averageOrderValue)}</strong>
                  </div>
                  <div>
                    <span>Joined Date</span>
                    <strong>{customer.joinedAt || "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="customer-section-card">
                <h3>Latest Activity</h3>
                {activity.slice(0, 4).map((item) => (
                  <div key={item.id} className="timeline-item compact">
                    <div className="timeline-dot" />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      <span>{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="customer-section-card">
                <h3>Last Note</h3>
                {overview.lastNote ? (
                  <div className="note-card">
                    <p>{overview.lastNote.text}</p>
                    <span>
                      {overview.lastNote.author} • {overview.lastNote.createdAt}
                    </span>
                  </div>
                ) : (
                  <p className="muted-empty">No notes available.</p>
                )}
              </div>

              <div className="customer-section-card">
                <h3>Last Purchase</h3>
                {overview.lastPurchase ? (
                  <div className="summary-list">
                    <div>
                      <span>Invoice</span>
                      <strong>{overview.lastPurchase.invoiceNo}</strong>
                    </div>
                    <div>
                      <span>Date</span>
                      <strong>{overview.lastPurchase.date}</strong>
                    </div>
                    <div>
                      <span>Quantity</span>
                      <strong>{overview.lastPurchase.quantity}</strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>{formatCurrency(overview.lastPurchase.total)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="muted-empty">No purchases available.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "purchases" && (
            <div className="customer-section-card">
              <h3>Purchases History</h3>

              <div className="table-wrapper" style={{ marginTop: "14px" }}>
                <table className="dashboard-table details-table">
                  <thead>
                    <tr>
                      <th>Invoice / Order</th>
                      <th>Date</th>
                      <th>Products</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {purchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td>{purchase.invoiceNo}</td>
                        <td>{purchase.date}</td>
                        <td>
                          <div className="stack-cell">
                            {purchase.products.map((product) => (
                              <span key={product}>{product}</span>
                            ))}
                          </div>
                        </td>
                        <td>{purchase.quantity}</td>
                        <td>{formatCurrency(purchase.total)}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              purchase.status === "Paid"
                                ? "paid"
                                : purchase.status === "Partial"
                                ? "partial"
                                : purchase.status === "Unpaid"
                                ? "unpaid"
                                : "cancelled"
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="customer-section-card">
              <h3>Payments</h3>

              <div className="table-wrapper" style={{ marginTop: "14px" }}>
                <table className="dashboard-table details-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.length > 0 ? (
                      payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.date}</td>
                          <td>{formatCurrency(payment.amount)}</td>
                          <td>{payment.method}</td>
                          <td>{payment.reference}</td>
                          <td>{payment.recordedBy}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-state-cell">
                          No payments available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="customer-section-card">
              <h3>Internal Notes</h3>

              <div className="notes-list">
                {notes.map((note) => (
                  <div key={note.id} className="note-card">
                    <p>{note.text}</p>
                    <span>
                      {note.author} • {note.createdAt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="customer-section-card">
              <h3>Activity Timeline</h3>

              <div className="timeline-list">
                {activity.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      <span>{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(() =>
    getCustomers().map((customer) => ({
      ...customer,
      email: customer.email || "",
      notes: customer.notes || "",
      location: customer.location || customer.address || "",
      isDeleted: customer.isDeleted || false,
    }))
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false);

  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<CustomerForm>(emptyForm);
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [pendingCloseTarget, setPendingCloseTarget] =
    useState<PendingCloseTarget>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "joinedAt",
    direction: "desc",
  });

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!actionMenuRef.current) return;
      if (!actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: key === "joinedAt" ? "desc" : "asc",
      };
    });
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const filteredCustomers = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const visibleCustomers = customers.filter((customer) => {
      if (customer.isDeleted) return false;
      if (!value) return true;

      return [
        customer.id,
        customer.name,
        customer.email || "",
        customer.phone,
        customer.location || "",
        customer.notes || "",
        customer.joinedAt || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);
    });

    return [...visibleCustomers].sort((a, b) => {
      const getValue = (customer: Customer) => {
        switch (sortConfig.key) {
          case "id":
            return customer.id || "";
          case "name":
            return customer.name || "";
          case "email":
            return customer.email || "";
          case "phone":
            return customer.phone || "";
          case "joinedAt":
            return customer.joinedAt || "";
          default:
            return "";
        }
      };

      const first = String(getValue(a)).toLowerCase();
      const second = String(getValue(b)).toLowerCase();

      if (first < second) return sortConfig.direction === "asc" ? -1 : 1;
      if (first > second) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [customers, searchTerm, sortConfig]);

  const hasAddUnsavedChanges = useMemo(() => {
    return (
      form.name.trim() !== "" ||
      form.email.trim() !== "" ||
      form.phone.trim() !== "" ||
      form.location.trim() !== "" ||
      form.notes.trim() !== ""
    );
  }, [form]);

  const hasEditUnsavedChanges = useMemo(() => {
    if (!editingCustomer) return false;

    return (
      editForm.name.trim() !== (editingCustomer.name || "") ||
      editForm.email.trim() !== (editingCustomer.email || "") ||
      editForm.phone.trim() !== (editingCustomer.phone || "") ||
      editForm.location.trim() !==
        (editingCustomer.location || editingCustomer.address || "") ||
      editForm.notes.trim() !== (editingCustomer.notes || "")
    );
  }, [editForm, editingCustomer]);

  const validateForm = (values: CustomerForm): FormErrors => {
    const errors: FormErrors = {};

    if (!values.name.trim()) {
      errors.name = "Customer name is required.";
    }

    if (!values.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d+$/.test(values.phone.trim())) {
      errors.phone = "Phone number must contain numbers only.";
    } else if (values.phone.trim().length !== 10) {
      errors.phone = "Phone number must be exactly 10 digits.";
    } else if (!isValidPhone(values.phone.trim())) {
      errors.phone = "Phone number must start with 059 or 056";
    }

    if (values.email.trim() && !isValidEmail(values.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!values.location.trim()) {
      errors.location = "Location is required.";
    }

    return errors;
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setShowAddConfirmModal(false);
    setForm(emptyForm);
    setFormErrors({});
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setEditForm(emptyForm);
    setEditErrors({});
  };

  const attemptCloseAddModal = () => {
    if (hasAddUnsavedChanges) {
      setPendingCloseTarget("add");
      return;
    }

    closeAddModal();
  };

  const attemptCloseEditModal = () => {
    if (hasEditUnsavedChanges) {
      setPendingCloseTarget("edit");
      return;
    }

    closeEditModal();
  };

  const discardPendingChanges = () => {
    if (pendingCloseTarget === "add") {
      closeAddModal();
    } else if (pendingCloseTarget === "edit") {
      closeEditModal();
    }

    setPendingCloseTarget(null);
  };

  const handlePhoneChange = (value: string, mode: "add" | "edit" = "add") => {
    const cleanedValue = value.replace(/\D/g, "").slice(0, 10);

    let phoneError: string | undefined;

    if (
      cleanedValue.length > 0 &&
      !(cleanedValue.startsWith("059") || cleanedValue.startsWith("056"))
    ) {
      phoneError = "Phone number must start with 059 or 056";
    } else if (cleanedValue.length === 10 && !isValidPhone(cleanedValue)) {
      phoneError =
        "Phone number must be exactly 10 digits and start with 059 or 056";
    } else {
      phoneError = undefined;
    }

    if (mode === "add") {
      setForm((prev) => ({ ...prev, phone: cleanedValue }));
      setFormErrors((prev) => ({ ...prev, phone: phoneError }));
    } else {
      setEditForm((prev) => ({ ...prev, phone: cleanedValue }));
      setEditErrors((prev) => ({ ...prev, phone: phoneError }));
    }
  };

  const requestAddCustomer = () => {
    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setShowAddConfirmModal(true);
  };

  const confirmAddCustomer = () => {
    const newCustomer: Customer = {
      id: `CUST-${1000 + customers.length + 1}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      address: form.location.trim(),
      notes: form.notes.trim(),
      joinedAt: new Date().toISOString().split("T")[0],
      isDeleted: false,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    closeAddModal();
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      location: customer.location || customer.address || "",
      notes: customer.notes || "",
    });
    setEditErrors({});
  };

  const handleEditCustomer = () => {
    if (!editingCustomer) return;

    const errors = validateForm(editForm);
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === editingCustomer.id
          ? {
              ...customer,
              name: editForm.name.trim(),
              email: editForm.email.trim(),
              phone: editForm.phone.trim(),
              location: editForm.location.trim(),
              address: editForm.location.trim(),
              notes: editForm.notes.trim(),
            }
          : customer
      )
    );

    closeEditModal();
  };

  const openDeleteModal = (id: string) => {
    setDeleteCustomerId(id);
    setDeleteCode("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setDeleteCustomerId(null);
    setDeleteCode("");
    setDeleteError("");
  };

  const confirmDeleteCustomer = () => {
    if (deleteCode.trim() !== DELETE_CONFIRMATION_CODE) {
      setDeleteError("Incorrect confirmation code. Please type 123.");
      return;
    }

    setCustomers((prev) =>
      prev.filter((customer) => customer.id !== deleteCustomerId)
    );

    closeDeleteModal();
  };

  const openNoteModal = (note?: string) => {
    const cleanNote = note?.trim() || "No notes available.";
    setSelectedNote(cleanNote);
    setIsNoteExpanded(false);
  };

  const closeNoteModal = () => {
    setSelectedNote(null);
    setIsNoteExpanded(false);
  };

  const openCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
  };

  const openEditFromDetails = () => {
    if (!selectedCustomer) return;
    openEditModal(selectedCustomer);
    closeCustomerDetails();
  };

  const toggleActionMenu = (customerId: string) => {
    setOpenActionMenuId((prev) => (prev === customerId ? null : customerId));
  };

  const shouldShowReadMore =
    !!selectedNote &&
    selectedNote !== "No notes available." &&
    selectedNote.length > NOTE_PREVIEW_LIMIT;

  const displayedNote =
    selectedNote && !isNoteExpanded && shouldShowReadMore
      ? `${selectedNote.slice(0, NOTE_PREVIEW_LIMIT)}...`
      : selectedNote;

  const modalShellStyle: React.CSSProperties = {
    width: "min(920px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 32px)",
    borderRadius: "28px",
    overflow: "hidden",
    padding: 0,
    background:
      "linear-gradient(180deg, rgba(248,251,255,0.98) 0%, #ffffff 100%)",
    boxShadow: "0 28px 90px rgba(15, 23, 42, 0.18)",
    border: "1px solid #e6eef7",
  };

  const modalContentScrollStyle: React.CSSProperties = {
    maxHeight: "calc(100vh - 220px)",
    overflowY: "auto",
    padding: "0 28px 28px",
  };

  const sectionCardStyle: React.CSSProperties = {
    background: "#fbfdff",
    border: "1px solid #e3edf8",
    borderRadius: "20px",
    padding: "18px",
  };

  const sortButtonStyle = (key: SortKey): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    background: "transparent",
    padding: 0,
    font: "inherit",
    color: sortConfig.key === key ? "#1d4ed8" : "#446889",
    fontWeight: 800,
    cursor: "pointer",
  });

  return (
    <>
      <div className="customers-page">
       <div className="customers-header refined">
  <div className="customers-title-wrap">
    <h1 className="dashboard-title customers-page-title">Customers</h1>
    <p className="dashboard-subtitle customers-page-subtitle">
      Manage your customer database.
    </p>
  </div>

  <div className="customers-header-tools">
    <div className="customers-inline-search">
      <span className="customers-inline-search-icon">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <input
        type="text"
        className="customers-inline-search-input"
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    <button
      className="quick-action-btn customers-add-btn"
      onClick={() => setShowAddModal(true)}
    >
      + Add Customer
    </button>
  </div>
</div>

        <div className="dashboard-card customers-table-card">
  <div className="table-wrapper customers-table-wrapper">
    <table className="dashboard-table customers-table">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      style={sortButtonStyle("id")}
                      onClick={() => requestSort("id")}
                    >
                      ID <span>{getSortIndicator("id")}</span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      style={sortButtonStyle("name")}
                      onClick={() => requestSort("name")}
                    >
                      Name <span>{getSortIndicator("name")}</span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      style={sortButtonStyle("email")}
                      onClick={() => requestSort("email")}
                    >
                      Email <span>{getSortIndicator("email")}</span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      style={sortButtonStyle("phone")}
                      onClick={() => requestSort("phone")}
                    >
                      Phone <span>{getSortIndicator("phone")}</span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      style={sortButtonStyle("joinedAt")}
                      onClick={() => requestSort("joinedAt")}
                    >
                      Joined <span>{getSortIndicator("joinedAt")}</span>
                    </button>
                  </th>
                  <th className="actions-header-cell">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>

                      <td>
                        <button
                          type="button"
                          className="name-link-btn"
                          onClick={() => openCustomerDetails(customer)}
                        >
                          {customer.name}
                        </button>
                      </td>

                      <td>
                        {customer.email?.trim()
                          ? customer.email
                          : "Not provided"}
                      </td>

                      <td>{customer.phone}</td>
                      <td>{customer.joinedAt}</td>

                      <td className="actions-cell">
                        <div
                          className="table-actions-menu"
                          ref={openActionMenuId === customer.id ? actionMenuRef : null}
                        >
                          <button
                            type="button"
                            className={`action-trigger-btn ${
                              openActionMenuId === customer.id ? "active" : ""
                            }`}
                            onClick={() => toggleActionMenu(customer.id)}
                            aria-label="Customer actions"
                            aria-expanded={openActionMenuId === customer.id}
                          >
                            <span className="action-dots">⋮</span>
                          </button>

                          {openActionMenuId === customer.id && (
                            <div className="action-dropdown-menu">
                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => {
                                  openCustomerDetails(customer);
                                  setOpenActionMenuId(null);
                                }}
                              >
                                <span className="action-icon">◉</span>
                                <span>View</span>
                              </button>

                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => {
                                  openEditModal(customer);
                                  setOpenActionMenuId(null);
                                }}
                              >
                                <span className="action-icon">✎</span>
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => {
                                  openNoteModal(customer.notes);
                                  setOpenActionMenuId(null);
                                }}
                              >
                                <span className="action-icon">⌘</span>
                                <span>Note</span>
                              </button>

                              <button
                                type="button"
                                className="action-dropdown-item delete"
                                onClick={() => {
                                  openDeleteModal(customer.id);
                                  setOpenActionMenuId(null);
                                }}
                              >
                                <span className="action-icon">✕</span>
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-state-cell">
                      No matching customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={attemptCloseAddModal}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={modalShellStyle}
          >
            <div
              className="modal-header"
              style={{
                padding: "28px 28px 20px",
                borderBottom: "1px solid #e8f0f8",
                background:
                  "linear-gradient(180deg, rgba(240,247,255,0.9) 0%, rgba(255,255,255,0.98) 100%)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: 800,
                    marginBottom: "12px",
                  }}
                >
                  New Customer
                </div>
                <h2>Add Customer</h2>
                <p>
                  Add a new customer profile with contact details, location, and
                  internal notes.
                </p>
              </div>

              <button className="modal-close-btn" onClick={attemptCloseAddModal}>
                ×
              </button>
            </div>

            <div style={modalContentScrollStyle}>
              <form className="modal-form" style={{ gap: "18px", paddingTop: "24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "18px",
                  }}
                >
                  <div style={sectionCardStyle}>
                    <label className="modal-label">Customer Name</label>
                    <input
                      className="modal-input"
                      type="text"
                      placeholder="Enter customer name"
                      value={form.name}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, name: e.target.value }));
                        setFormErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                    />
                    {formErrors.name && (
                      <p className="form-error">{formErrors.name}</p>
                    )}
                  </div>

                  <div style={sectionCardStyle}>
                    <label className="modal-label">
                      Email <span className="optional-label">(Optional)</span>
                    </label>

                    <EmailInput
                      value={form.email}
                      placeholder="Enter email address (Optional)"
                      error={formErrors.email}
                      onChange={(value) => {
                        setForm((prev) => ({ ...prev, email: value }));
                        setFormErrors((prev) => ({
                          ...prev,
                          email: undefined,
                        }));
                      }}
                    />
                  </div>

                  <div style={sectionCardStyle}>
                    <label className="modal-label">Phone</label>
                    <input
                      className="modal-input"
                      type="text"
                      placeholder="Phone must start with 059 or 056"
                      value={form.phone}
                      onChange={(e) => handlePhoneChange(e.target.value, "add")}
                    />
                    {formErrors.phone && (
                      <p className="form-error">{formErrors.phone}</p>
                    )}
                  </div>

                  <div style={sectionCardStyle}>
                    <label className="modal-label">Location</label>
                    <LocationSelect
                      value={form.location}
                      error={formErrors.location}
                      onChange={(value) => {
                        setForm((prev) => ({ ...prev, location: value }));
                        setFormErrors((prev) => ({
                          ...prev,
                          location: undefined,
                        }));
                      }}
                    />
                  </div>
                </div>

                <div style={sectionCardStyle}>
                  <label className="modal-label">Notes</label>
                  <textarea
                    className="modal-input"
                    placeholder="Enter customer notes"
                    rows={7}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    style={{ minHeight: "160px", resize: "vertical" }}
                  />
                </div>

                <div
                  className="modal-actions"
                  style={{
                    position: "sticky",
                    bottom: 0,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.86) 0%, #ffffff 50%)",
                    paddingTop: "16px",
                    marginTop: "4px",
                  }}
                >
                  <button
                    type="button"
                    className="modal-secondary-btn"
                    onClick={attemptCloseAddModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="modal-primary-btn"
                    onClick={requestAddCustomer}
                  >
                    Save Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowAddConfirmModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Confirm Addition</h2>
                <p>Review this action before saving.</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowAddConfirmModal(false)}
              >
                ×
              </button>
            </div>

            <p className="confirm-text">Are you sure you want to add this customer?</p>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={() => setShowAddConfirmModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-primary-btn"
                onClick={confirmAddCustomer}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCustomer && (
        <div className="modal-overlay" onClick={attemptCloseEditModal}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={modalShellStyle}
          >
            <div
              className="modal-header"
              style={{
                padding: "28px 28px 20px",
                borderBottom: "1px solid #e8f0f8",
                background:
                  "linear-gradient(180deg, rgba(240,247,255,0.9) 0%, rgba(255,255,255,0.98) 100%)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "#eefbf4",
                    color: "#0f766e",
                    fontSize: "12px",
                    fontWeight: 800,
                    marginBottom: "12px",
                  }}
                >
                  Customer Update
                </div>
                <h2>Edit Customer</h2>
                <p>Update customer information while keeping the same page style.</p>
              </div>

              <button className="modal-close-btn" onClick={attemptCloseEditModal}>
                ×
              </button>
            </div>

            <div style={modalContentScrollStyle}>
              <form className="modal-form" style={{ gap: "18px", paddingTop: "24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "18px",
                  }}
                >
                  <div style={sectionCardStyle}>
                    <label className="modal-label">Customer Name</label>
                    <input
                      className="modal-input"
                      value={editForm.name}
                      onChange={(e) => {
                        setEditForm((prev) => ({ ...prev, name: e.target.value }));
                        setEditErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                    />
                    {editErrors.name && (
                      <p className="form-error">{editErrors.name}</p>
                    )}
                  </div>

                  <div style={sectionCardStyle}>
                    <label className="modal-label">
                      Email <span className="optional-label">(Optional)</span>
                    </label>

                    <EmailInput
                      value={editForm.email}
                      placeholder="Enter email address (Optional)"
                      error={editErrors.email}
                      onChange={(value) => {
                        setEditForm((prev) => ({ ...prev, email: value }));
                        setEditErrors((prev) => ({
                          ...prev,
                          email: undefined,
                        }));
                      }}
                    />
                  </div>

                  <div style={sectionCardStyle}>
                    <label className="modal-label">Phone</label>
                    <input
                      className="modal-input"
                      type="text"
                      placeholder="Phone must start with 059 or 056"
                      value={editForm.phone}
                      onChange={(e) => handlePhoneChange(e.target.value, "edit")}
                    />
                    {editErrors.phone && (
                      <p className="form-error">{editErrors.phone}</p>
                    )}
                  </div>

                  <div style={sectionCardStyle}>
                    <label className="modal-label">Location</label>
                    <LocationSelect
                      value={editForm.location}
                      error={editErrors.location}
                      onChange={(value) => {
                        setEditForm((prev) => ({
                          ...prev,
                          location: value,
                        }));
                        setEditErrors((prev) => ({
                          ...prev,
                          location: undefined,
                        }));
                      }}
                    />
                  </div>
                </div>

                <div style={sectionCardStyle}>
                  <label className="modal-label">Notes</label>
                  <textarea
                    className="modal-input"
                    rows={7}
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    style={{ minHeight: "160px", resize: "vertical" }}
                  />
                </div>

                <div
                  className="modal-actions"
                  style={{
                    position: "sticky",
                    bottom: 0,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.86) 0%, #ffffff 50%)",
                    paddingTop: "16px",
                    marginTop: "4px",
                  }}
                >
                  <button
                    type="button"
                    className="modal-secondary-btn"
                    onClick={attemptCloseEditModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="modal-primary-btn"
                    onClick={handleEditCustomer}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteCustomerId && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Confirm Deletion</h2>
                <p>Delete action requires confirmation code.</p>
              </div>

              <button className="modal-close-btn" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <p className="confirm-text">
              To confirm deletion, type <strong>123</strong>
            </p>

            <div className="modal-spacing-top">
              <input
                className="modal-input"
                type="text"
                placeholder="Type 123"
                value={deleteCode}
                onChange={(e) => {
                  setDeleteCode(e.target.value);
                  setDeleteError("");
                }}
              />
              {deleteError && <p className="form-error">{deleteError}</p>}
            </div>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="quick-action-btn delete-btn"
                onClick={confirmDeleteCustomer}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedNote !== null && (
        <div className="modal-overlay" onClick={closeNoteModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Customer Note</h2>
                <p>Customer note details.</p>
              </div>

              <button className="modal-close-btn" onClick={closeNoteModal}>
                ×
              </button>
            </div>

            <div className="note-content-wrapper">
              <p
                className={`note-content ${
                  isNoteExpanded ? "note-content-expanded" : ""
                }`}
              >
                {displayedNote}
              </p>

              {shouldShowReadMore && (
                <button
                  type="button"
                  className="note-toggle-btn"
                  onClick={() => setIsNoteExpanded((prev) => !prev)}
                >
                  {isNoteExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button className="modal-primary-btn" onClick={closeNoteModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerDetailsModal
        customer={selectedCustomer}
        onClose={closeCustomerDetails}
        onEdit={openEditFromDetails}
      />

      <ConfirmCloseModal
        open={pendingCloseTarget !== null}
        title="Unsaved Changes"
        description="Please confirm before closing this form."
        onKeepEditing={() => setPendingCloseTarget(null)}
        onDiscard={discardPendingChanges}
      />
    </>
  );
}