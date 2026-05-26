import type { StockLevel, StockMovement } from "./types";

export const STOCK_LEVELS: StockLevel[] = [
  { productId: "PROD-001", warehouseId: "WH-MAIN", onHand: 450, reserved: 80, reorderPoint: 100, lastCountDate: "2026-05-10" },
  { productId: "PROD-002", warehouseId: "WH-MAIN", onHand: 120, reserved: 20, reorderPoint: 50, lastCountDate: "2026-05-10" },
  { productId: "PROD-003", warehouseId: "WH-MAIN", onHand: 30, reserved: 10, reorderPoint: 50, lastCountDate: "2026-05-08" },
  { productId: "PROD-004", warehouseId: "WH-SEC", onHand: 200, reserved: 0, reorderPoint: 75, lastCountDate: "2026-05-12" },
  { productId: "PROD-005", warehouseId: "WH-MAIN", onHand: 0, reserved: 0, reorderPoint: 25, lastCountDate: "2026-05-01" },
];

export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: "MV-2001", date: "2026-05-01", productId: "PROD-001", warehouseId: "WH-MAIN", type: "in", quantity: 200, reference: "PO-1001", notes: "Supplier delivery" },
  { id: "MV-2002", date: "2026-05-03", productId: "PROD-002", warehouseId: "WH-MAIN", type: "out", quantity: -50, reference: "SO-5001", notes: "Customer order" },
  { id: "MV-2003", date: "2026-05-05", productId: "PROD-003", warehouseId: "WH-MAIN", type: "adjustment", quantity: -5, notes: "Damaged goods write-off" },
  { id: "MV-2004", date: "2026-05-08", productId: "PROD-004", warehouseId: "WH-MAIN", type: "transfer", quantity: -100, reference: "TRF-001", notes: "Transfer to secondary warehouse" },
  { id: "MV-2005", date: "2026-05-08", productId: "PROD-004", warehouseId: "WH-SEC", type: "transfer", quantity: 100, reference: "TRF-001", notes: "Transfer from main warehouse" },
  { id: "MV-2006", date: "2026-05-12", productId: "PROD-001", warehouseId: "WH-MAIN", type: "out", quantity: -80, reference: "SO-5010" },
  { id: "MV-2007", date: "2026-05-15", productId: "PROD-002", warehouseId: "WH-MAIN", type: "in", quantity: 90, reference: "PO-1008" },
];
