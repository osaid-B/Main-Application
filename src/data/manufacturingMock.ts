import type { ProductionOrder } from "./types";

export const PRODUCTION_ORDERS: ProductionOrder[] = [
  {
    id: "MO-3001",
    productId: "PROD-001",
    quantity: 500,
    startDate: "2026-05-01",
    dueDate: "2026-05-15",
    status: "done",
    bom: [
      { productId: "PROD-003", quantity: 2 },
      { productId: "PROD-004", quantity: 1 },
    ],
  },
  {
    id: "MO-3002",
    productId: "PROD-002",
    quantity: 300,
    startDate: "2026-05-10",
    dueDate: "2026-05-25",
    status: "in-progress",
    bom: [
      { productId: "PROD-003", quantity: 1 },
    ],
  },
  {
    id: "MO-3003",
    productId: "PROD-001",
    quantity: 400,
    startDate: "2026-05-20",
    dueDate: "2026-06-05",
    status: "planned",
    bom: [
      { productId: "PROD-003", quantity: 2 },
      { productId: "PROD-005", quantity: 3 },
    ],
  },
  {
    id: "MO-3004",
    productId: "PROD-004",
    quantity: 150,
    startDate: "2026-04-15",
    dueDate: "2026-04-30",
    status: "cancelled",
    bom: [],
  },
];
