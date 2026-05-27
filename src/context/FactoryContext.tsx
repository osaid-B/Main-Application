import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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

interface FactoryContextValue {
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
  updateOrderStatus: (id: string, status: ProductionOrderStatus) => void;
  updateFinishedGoodQty: (id: string, delta: number) => void;
  addImportOrder: (order: ImportOrder) => void;
}

const FactoryContext = createContext<FactoryContextValue | null>(null);

export function FactoryProvider({ children }: { children: ReactNode }) {
  const [factoryOrders, setFactoryOrders] = useState<ProductionOrder[]>(FACTORY_ORDERS);
  const [qualityChecks]                   = useState<QualityCheck[]>(FACTORY_QC);
  const [boms]                            = useState<BomTemplate[]>(FACTORY_BOMS);
  const [rawMaterials]                    = useState<RawMaterial[]>(RAW_MATERIALS);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>(FINISHED_GOODS);
  const [warehouseLocations]              = useState<WarehouseLocation[]>(WAREHOUSE_LOCATIONS);
  const [sourceRecords]                   = useState<SourceRecord[]>(SOURCE_RECORDS);
  const [importOrders, setImportOrders]   = useState<ImportOrder[]>(IMPORT_ORDERS);
  const [batches]                         = useState<ProductionBatch[]>(PRODUCTION_BATCHES);
  const [costingEntries]                  = useState<CostingEntry[]>(COSTING_ENTRIES);

  function updateOrderStatus(id: string, status: ProductionOrderStatus) {
    setFactoryOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));

    // When order is marked done → add produced qty to matching finished good
    if (status === "done") {
      const order = factoryOrders.find((o) => o.id === id);
      if (order) {
        setFinishedGoods((prev) => prev.map((g) =>
          g.productionOrderId === id
            ? { ...g, onHand: g.onHand + order.quantity, lastProducedDate: new Date().toISOString().slice(0, 10) }
            : g
        ));
      }
    }
  }

  function updateFinishedGoodQty(id: string, delta: number) {
    setFinishedGoods((prev) => prev.map((g) => g.id === id ? { ...g, onHand: Math.max(0, g.onHand + delta) } : g));
  }

  function addImportOrder(order: ImportOrder) {
    setImportOrders((prev) => [order, ...prev]);
  }

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
    openBatches:        batches.filter((b) => b.status === "open").length,
    totalFinishedOnHand: finishedGoods.reduce((s, g) => s + g.onHand, 0),
  }), [factoryOrders, qualityChecks, rawMaterials, importOrders, batches, finishedGoods]);

  const value: FactoryContextValue = {
    factoryOrders, qualityChecks, boms, rawMaterials, finishedGoods,
    warehouseLocations, sourceRecords, importOrders, batches, costingEntries,
    factoryProducts: FACTORY_PRODUCTS,
    kpi,
    updateOrderStatus, updateFinishedGoodQty, addImportOrder,
  };

  return <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>;
}

export function useFactory(): FactoryContextValue {
  const ctx = useContext(FactoryContext);
  if (!ctx) throw new Error("useFactory must be used within FactoryProvider");
  return ctx;
}
