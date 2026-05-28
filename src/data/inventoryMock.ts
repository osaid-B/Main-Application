import type { StockLevel } from "./types";

export const STOCK_LEVELS: StockLevel[] = [
  { productId: "PROD-001", warehouseId: "WH-MAIN", onHand: 450, reserved: 80, reorderPoint: 100, lastCountDate: "2026-05-10" },
  { productId: "PROD-002", warehouseId: "WH-MAIN", onHand: 120, reserved: 20, reorderPoint: 50, lastCountDate: "2026-05-10" },
  { productId: "PROD-003", warehouseId: "WH-MAIN", onHand: 30, reserved: 10, reorderPoint: 50, lastCountDate: "2026-05-08" },
  { productId: "PROD-004", warehouseId: "WH-SEC", onHand: 200, reserved: 0, reorderPoint: 75, lastCountDate: "2026-05-12" },
  { productId: "PROD-005", warehouseId: "WH-MAIN", onHand: 0, reserved: 0, reorderPoint: 25, lastCountDate: "2026-05-01" },
];
