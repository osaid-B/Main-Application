import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { USE_SUPABASE } from "../lib/supabase";
import { useRealtimeSubscriptions } from "../hooks/useRealtimeSubscriptions";
import {
  fetchFactoryOrders,
  fetchBoms,
  fetchQualityChecks,
  fetchBatches,
  fetchRawMaterials,
  fetchFinishedGoods,
  fetchWarehouseLocations,
  fetchImportOrders,
  fetchCostingEntries,
} from "../services/factory";
import {
  factoryOrderFromRow,
  qualityCheckFromRow,
  rawMaterialFromRow,
  finishedGoodFromRow,
  warehouseLocationFromRow,
  importOrderFromRow,
  productionBatchFromRow,
  costingEntryFromRow,
  bomTemplateFromRow,
} from "../services/adapters";
import type { FactoryOrderRow, ImportOrderLineRow, FactoryBomLineRow } from "../types/database";
import type {
  ProductionOrder,
  ProductionOrderStatus,
  QualityCheck,
  RawMaterial,
  FinishedGood,
  WarehouseLocation,
  ImportOrder,
  ProductionBatch,
  CostingEntry,
} from "../data/types";
import type { BomTemplate, SourceRecord } from "../data/factoryMock";
import {
  FACTORY_ORDERS,
  FACTORY_QC,
  FACTORY_BOMS,
  RAW_MATERIALS,
  FINISHED_GOODS,
  WAREHOUSE_LOCATIONS,
  SOURCE_RECORDS,
  IMPORT_ORDERS,
  PRODUCTION_BATCHES,
  COSTING_ENTRIES,
  FACTORY_PRODUCTS,
} from "../data/factoryMock";

export interface FactoryContextValue {
  // Data
  factoryOrders: ProductionOrder[];
  qualityChecks: QualityCheck[];
  boms: BomTemplate[];
  rawMaterials: RawMaterial[];
  finishedGoods: FinishedGood[];
  warehouseLocations: WarehouseLocation[];
  sourceRecords: SourceRecord[];
  importOrders: ImportOrder[];
  batches: ProductionBatch[];
  costingEntries: CostingEntry[];
  factoryProducts: typeof FACTORY_PRODUCTS;

  // Derived KPIs
  kpi: {
    activeOrders: number;
    plannedOrders: number;
    completedOrders: number;
    qcPassRate: number;
    rawMaterialAlerts: number;
    openImports: number;
    openBatches: number;
    totalFinishedOnHand: number;
  };

  // Actions
  updateOrderStatus: (id: string, status: ProductionOrderStatus) => string[];
  updateFinishedGoodQty: (id: string, delta: number) => void;
  addImportOrder: (order: ImportOrder) => void;
  receiveImport: (id: string) => void;
}

const FactoryContext = createContext<FactoryContextValue | null>(null);

export function FactoryProvider({ children }: { children: ReactNode }) {
  const [factoryOrders, setFactoryOrders]       = useState<ProductionOrder[]>(FACTORY_ORDERS);
  const [qualityChecks, setQualityChecks]       = useState<QualityCheck[]>(FACTORY_QC);
  const [boms, setBoms]                         = useState<BomTemplate[]>(FACTORY_BOMS);
  const [rawMaterials, setRawMaterials]         = useState<RawMaterial[]>(RAW_MATERIALS);
  const [finishedGoods, setFinishedGoods]       = useState<FinishedGood[]>(FINISHED_GOODS);
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>(WAREHOUSE_LOCATIONS);
  const [sourceRecords]                         = useState<SourceRecord[]>(SOURCE_RECORDS);
  const [importOrders, setImportOrders]         = useState<ImportOrder[]>(IMPORT_ORDERS);
  const [batches, setBatches]                   = useState<ProductionBatch[]>(PRODUCTION_BATCHES);
  const [costingEntries, setCostingEntries]     = useState<CostingEntry[]>(COSTING_ENTRIES);

  // ── Supabase bootstrap ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!USE_SUPABASE) return;
    Promise.all([
      fetchFactoryOrders(),
      fetchBoms(),
      fetchQualityChecks(),
      fetchBatches(),
      fetchRawMaterials(),
      fetchFinishedGoods(),
      fetchWarehouseLocations(),
      fetchImportOrders(),
      fetchCostingEntries(),
    ]).then(([dbOrders, dbBoms, dbQc, dbBatches, dbRaw, dbFg, dbWh, dbImports, dbCosting]) => {
      if (dbOrders.length)  setFactoryOrders(dbOrders.map(factoryOrderFromRow));
      if (dbBoms.length)    setBoms(dbBoms.map((r) => bomTemplateFromRow(r as typeof r & { factory_bom_lines?: FactoryBomLineRow[] })));
      if (dbQc.length)      setQualityChecks(dbQc.map(qualityCheckFromRow));
      if (dbBatches.length) setBatches(dbBatches.map(productionBatchFromRow));
      if (dbRaw.length)     setRawMaterials(dbRaw.map(rawMaterialFromRow));
      if (dbFg.length)      setFinishedGoods(dbFg.map(finishedGoodFromRow));
      if (dbWh.length)      setWarehouseLocations(dbWh.map(warehouseLocationFromRow));
      if (dbImports.length) setImportOrders(dbImports.map((r) => importOrderFromRow(r as typeof r & { factory_import_lines?: ImportOrderLineRow[] })));
      if (dbCosting.length) setCostingEntries(dbCosting.map(costingEntryFromRow));
    }).catch((e) => console.warn("[FactoryContext] Supabase bootstrap failed, using mock data:", e));
  }, []);

  // ── Realtime: keep factory orders in sync with DB changes ────────────────────
  const handleFactoryOrderChange = useCallback((row: FactoryOrderRow) => {
    setFactoryOrders((prev) => {
      const exists = prev.find((o) => o.id === row.id);
      const updated: ProductionOrder = {
        id: row.id,
        productId: row.product_id,
        quantity: row.quantity,
        startDate: row.start_date,
        dueDate: row.due_date,
        status: row.status,
        bom: [],
      };
      if (exists) return prev.map((o) => (o.id === row.id ? { ...o, ...updated } : o));
      return [...prev, updated];
    });
  }, []);

  useRealtimeSubscriptions({ onFactoryOrderChange: handleFactoryOrderChange });

  function updateOrderStatus(id: string, status: ProductionOrderStatus): string[] {
    const order = factoryOrders.find((o) => o.id === id);
    const bom = order ? boms.find((b) => b.productId === order.productId) : null;
    const insufficient: string[] = [];

    // Check stock against BOM when starting
    if ((status === "in-progress" || status === "done") && order && bom) {
      for (const line of bom.lines) {
        const mat = rawMaterials.find((m) => m.id === line.materialId);
        const needed = line.quantity * order.quantity;
        if (mat && mat.onHand < needed) {
          insufficient.push(mat.name);
        }
      }
    }

    setFactoryOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));

    // When order is marked done → deduct raw materials + add produced qty to finished good
    if (status === "done" && order) {
      if (bom) {
        setRawMaterials((prev) =>
          prev.map((m) => {
            const line = bom.lines.find((l) => l.materialId === m.id);
            if (!line) return m;
            return { ...m, onHand: Math.max(0, m.onHand - line.quantity * order.quantity) };
          })
        );
      }
      setFinishedGoods((prev) => {
        const today = new Date().toISOString().slice(0, 10);
        const existing = prev.find((g) => g.productionOrderId === id);
        if (existing) {
          return prev.map((g) =>
            g.productionOrderId === id
              ? { ...g, onHand: g.onHand + order.quantity, lastProducedDate: today }
              : g
          );
        }
        // Create a new FG entry for orders without a pre-existing finished good record
        const fg: import("../data/types").FinishedGood = {
          id: `FG-${id}`,
          name: FACTORY_PRODUCTS.find((p) => p.id === order.productId)?.name ?? order.productId,
          nameAr: FACTORY_PRODUCTS.find((p) => p.id === order.productId)?.nameAr ?? order.productId,
          sku: order.productId,
          category: "Other",
          onHand: order.quantity,
          reserved: 0,
          unitCost: 0,
          sellingPrice: 0,
          productionOrderId: id,
          lastProducedDate: today,
        };
        return [...prev, fg];
      });
    }

    return insufficient;
  }

  function updateFinishedGoodQty(id: string, delta: number) {
    setFinishedGoods((prev) => prev.map((g) => g.id === id ? { ...g, onHand: Math.max(0, g.onHand + delta) } : g));
  }

  function addImportOrder(order: ImportOrder) {
    setImportOrders((prev) => [order, ...prev]);
  }

  function receiveImport(id: string) {
    const imp = importOrders.find((o) => o.id === id);
    if (!imp || imp.status === "received" || imp.status === "cancelled") return;
    setImportOrders((prev) =>
      prev.map((o) => o.id === id ? { ...o, status: "received" as const, actualArrival: new Date().toISOString().slice(0, 10) } : o)
    );
    // Increment raw material onHand by matching on item name
    setRawMaterials((prev) =>
      prev.map((mat) => {
        const item = imp.items.find((i) => i.name.toLowerCase() === mat.name.toLowerCase());
        if (!item) return mat;
        return { ...mat, onHand: mat.onHand + item.quantity, lastPurchaseDate: new Date().toISOString().slice(0, 10) };
      })
    );
  }

  // Derive batch qcStatus + batch status from live QC checks
  const batchesLive = useMemo(() =>
    batches.map((b) => {
      const batchQcChecks = qualityChecks.filter((q) => q.batchId === b.id);
      if (batchQcChecks.length === 0) return b;
      const hasFail = batchQcChecks.some((q) => q.status === "fail");
      const allPass = batchQcChecks.every((q) => q.status === "pass");
      const hasConditional = batchQcChecks.some((q) => q.status === "conditional");
      const hasPending = batchQcChecks.some((q) => q.status === "pending");
      const derivedQc = hasFail ? "fail" : allPass ? "pass" : hasConditional ? "conditional" : hasPending ? "pending" : "pass";
      const derivedStatus = hasFail ? "quarantine" : b.status;
      return { ...b, qcStatus: derivedQc as import("../data/types").QcStatus, status: derivedStatus as import("../data/types").BatchStatus };
    }),
  [batches, qualityChecks]);

  const kpi = useMemo(() => ({
    activeOrders:       factoryOrders.filter((o) => o.status === "in-progress").length,
    plannedOrders:      factoryOrders.filter((o) => o.status === "planned").length,
    completedOrders:    factoryOrders.filter((o) => o.status === "done").length,
    qcPassRate:         (() => {
      const decided = qualityChecks.filter((q) => q.status !== "pending");
      return decided.length > 0 ? Math.round(qualityChecks.filter((q) => q.status === "pass").length / decided.length * 100) : 0;
    })(),
    rawMaterialAlerts:  rawMaterials.filter((r) => r.onHand <= r.reorderPoint).length,
    openImports:        importOrders.filter((i) => i.status !== "received" && i.status !== "cancelled").length,
    openBatches:        batchesLive.filter((b) => b.status === "open").length,
    totalFinishedOnHand: finishedGoods.reduce((s, g) => s + g.onHand, 0),
  }), [factoryOrders, qualityChecks, rawMaterials, importOrders, batchesLive, finishedGoods]);

  const value: FactoryContextValue = {
    factoryOrders, qualityChecks, boms, rawMaterials, finishedGoods,
    warehouseLocations, sourceRecords, importOrders, batches: batchesLive, costingEntries,
    factoryProducts: FACTORY_PRODUCTS,
    kpi,
    updateOrderStatus, updateFinishedGoodQty, addImportOrder, receiveImport,
  };

  return <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>;
}

export function useFactory(): FactoryContextValue {
  const ctx = useContext(FactoryContext);
  if (!ctx) throw new Error("useFactory must be used within FactoryProvider");
  return ctx;
}
