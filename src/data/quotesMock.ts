import type { Quote } from "./types";

export const QUOTES: Quote[] = [
  {
    id: "QT-4001",
    customerId: "CUST-001",
    date: "2026-05-02",
    validUntil: "2026-06-02",
    lines: [
      { productId: "PROD-001", quantity: 50, unitPrice: 120, discountPct: 5 },
      { productId: "PROD-002", quantity: 20, unitPrice: 80 },
    ],
    subtotal: 7200,
    tax: 1152,
    total: 8352,
    status: "sent",
  },
  {
    id: "QT-4002",
    customerId: "CUST-003",
    date: "2026-05-08",
    validUntil: "2026-06-08",
    lines: [
      { productId: "PROD-003", quantity: 100, unitPrice: 45 },
    ],
    subtotal: 4500,
    tax: 720,
    total: 5220,
    status: "accepted",
    convertedInvoiceId: "INV-8801",
  },
  {
    id: "QT-4003",
    customerId: "CUST-007",
    date: "2026-05-12",
    validUntil: "2026-06-12",
    lines: [
      { productId: "PROD-001", quantity: 200, unitPrice: 115, discountPct: 10 },
      { productId: "PROD-004", quantity: 30, unitPrice: 200 },
    ],
    subtotal: 26700,
    tax: 4272,
    total: 30972,
    status: "draft",
  },
  {
    id: "QT-4004",
    customerId: "CUST-002",
    date: "2026-04-20",
    validUntil: "2026-05-20",
    lines: [
      { productId: "PROD-002", quantity: 75, unitPrice: 80 },
    ],
    subtotal: 6000,
    tax: 960,
    total: 6960,
    status: "expired",
  },
  {
    id: "QT-4005",
    customerId: "CUST-005",
    date: "2026-05-18",
    validUntil: "2026-06-18",
    lines: [
      { productId: "PROD-005", quantity: 10, unitPrice: 350 },
    ],
    subtotal: 3500,
    tax: 560,
    total: 4060,
    status: "rejected",
  },
];
