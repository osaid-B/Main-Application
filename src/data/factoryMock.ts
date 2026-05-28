import type {
  ProductionOrder,
  QualityCheck,
  RawMaterial,
  FinishedGood,
  WarehouseLocation,
  ImportOrder,
  ProductionBatch,
  CostingEntry,
} from "./types";

// ── Products reference (used across factory pages) ────────────────────────────

export const FACTORY_PRODUCTS: Array<{ id: string; name: string; nameAr: string; sku: string; category: string }> = [
  { id: "FP-001", name: "زيت زيتون بكر ممتاز 500مل", nameAr: "زيت زيتون بكر ممتاز 500مل", sku: "EVOO-500", category: "Oil" },
  { id: "FP-002", name: "زيت زيتون بكر ممتاز 1 لتر", nameAr: "زيت زيتون بكر ممتاز 1 لتر", sku: "EVOO-1L", category: "Oil" },
  { id: "FP-003", name: "معجون طماطم 400 جرام", nameAr: "معجون طماطم 400 جرام", sku: "TP-400", category: "Paste" },
  { id: "FP-004", name: "حمص معلب 800 جرام", nameAr: "حمص معلب 800 جرام", sku: "CC-800", category: "Canned" },
  { id: "FP-005", name: "تين مجفف 500 جرام", nameAr: "تين مجفف 500 جرام", sku: "DF-500", category: "Dried" },
  { id: "FP-006", name: "طحينة 300 جرام", nameAr: "طحينة 300 جرام", sku: "TAH-300", category: "Paste" },
];

// ── Production Orders ─────────────────────────────────────────────────────────

export const FACTORY_ORDERS: ProductionOrder[] = [
  {
    id: "MO-1001",
    productId: "FP-001",
    quantity: 2400,
    startDate: "2026-05-01",
    dueDate: "2026-05-10",
    status: "done",
    bom: [
      { productId: "RM-001", quantity: 1200 },
      { productId: "RM-002", quantity: 2400 },
      { productId: "RM-005", quantity: 2400 },
    ],
  },
  {
    id: "MO-1002",
    productId: "FP-002",
    quantity: 1800,
    startDate: "2026-05-05",
    dueDate: "2026-05-18",
    status: "done",
    bom: [
      { productId: "RM-001", quantity: 1800 },
      { productId: "RM-003", quantity: 1800 },
      { productId: "RM-005", quantity: 1800 },
    ],
  },
  {
    id: "MO-1003",
    productId: "FP-003",
    quantity: 3000,
    startDate: "2026-05-12",
    dueDate: "2026-05-22",
    status: "in-progress",
    bom: [
      { productId: "RM-006", quantity: 6000 },
      { productId: "RM-004", quantity: 3000 },
      { productId: "RM-007", quantity: 3000 },
    ],
  },
  {
    id: "MO-1004",
    productId: "FP-004",
    quantity: 1500,
    startDate: "2026-05-15",
    dueDate: "2026-05-28",
    status: "in-progress",
    bom: [
      { productId: "RM-008", quantity: 1500 },
      { productId: "RM-004", quantity: 1500 },
      { productId: "RM-007", quantity: 1500 },
    ],
  },
  {
    id: "MO-1005",
    productId: "FP-005",
    quantity: 900,
    startDate: "2026-05-20",
    dueDate: "2026-06-03",
    status: "planned",
    bom: [
      { productId: "RM-009", quantity: 900 },
      { productId: "RM-010", quantity: 900 },
    ],
  },
  {
    id: "MO-1006",
    productId: "FP-006",
    quantity: 1200,
    startDate: "2026-05-25",
    dueDate: "2026-06-08",
    status: "planned",
    bom: [
      { productId: "RM-011", quantity: 600 },
      { productId: "RM-004", quantity: 1200 },
      { productId: "RM-005", quantity: 1200 },
    ],
  },
  {
    id: "MO-1007",
    productId: "FP-001",
    quantity: 600,
    startDate: "2026-04-10",
    dueDate: "2026-04-20",
    status: "cancelled",
    bom: [],
  },
];

// ── Bills of Material ─────────────────────────────────────────────────────────

export interface BomTemplate {
  id: string;
  productId: string;
  productName: string;
  productNameAr: string;
  version: string;
  effectiveDate: string;
  lines: Array<{ materialId: string; materialName: string; materialNameAr: string; quantity: number; unit: string; unitCost: number }>;
}

export const FACTORY_BOMS: BomTemplate[] = [
  {
    id: "BOM-001",
    productId: "FP-001",
    productName: "زيت زيتون بكر ممتاز 500مل",
    productNameAr: "زيت زيتون بكر ممتاز 500مل",
    version: "v2.1",
    effectiveDate: "2026-01-01",
    lines: [
      { materialId: "RM-001", materialName: "Fresh Olive Fruit", materialNameAr: "ثمار الزيتون الطازجة", quantity: 0.5, unit: "kg", unitCost: 12.0 },
      { materialId: "RM-002", materialName: "500ml Glass Bottle", materialNameAr: "زجاجة زجاجية 500مل",   quantity: 1,   unit: "pcs", unitCost: 3.5 },
      { materialId: "RM-005", materialName: "Product Label",      materialNameAr: "ملصق المنتج",            quantity: 1,   unit: "pcs", unitCost: 0.4 },
    ],
  },
  {
    id: "BOM-002",
    productId: "FP-002",
    productName: "زيت زيتون بكر ممتاز 1 لتر",
    productNameAr: "زيت زيتون بكر ممتاز 1 لتر",
    version: "v2.0",
    effectiveDate: "2026-01-01",
    lines: [
      { materialId: "RM-001", materialName: "Fresh Olive Fruit", materialNameAr: "ثمار الزيتون الطازجة", quantity: 1.0, unit: "kg", unitCost: 12.0 },
      { materialId: "RM-003", materialName: "1L Glass Bottle",   materialNameAr: "زجاجة زجاجية 1 لتر",   quantity: 1,   unit: "pcs", unitCost: 5.2 },
      { materialId: "RM-005", materialName: "Product Label",     materialNameAr: "ملصق المنتج",            quantity: 1,   unit: "pcs", unitCost: 0.4 },
    ],
  },
  {
    id: "BOM-003",
    productId: "FP-003",
    productName: "معجون طماطم 400 جرام",
    productNameAr: "معجون طماطم 400 جرام",
    version: "v1.5",
    effectiveDate: "2026-02-01",
    lines: [
      { materialId: "RM-006", materialName: "Fresh Tomatoes", materialNameAr: "طماطم طازجة",    quantity: 2.0, unit: "kg", unitCost: 2.8 },
      { materialId: "RM-004", materialName: "400g Tin Can",   materialNameAr: "علبة معدنية 400 جرام", quantity: 1, unit: "pcs", unitCost: 1.8 },
      { materialId: "RM-007", materialName: "Can Lid",        materialNameAr: "غطاء العلبة",   quantity: 1,   unit: "pcs", unitCost: 0.6 },
    ],
  },
  {
    id: "BOM-004",
    productId: "FP-004",
    productName: "حمص معلب 800 جرام",
    productNameAr: "حمص معلب 800 جرام",
    version: "v1.3",
    effectiveDate: "2026-02-01",
    lines: [
      { materialId: "RM-008", materialName: "Dried Chickpeas", materialNameAr: "حمص مجفف",           quantity: 0.5, unit: "kg", unitCost: 6.0 },
      { materialId: "RM-004", materialName: "800g Tin Can",   materialNameAr: "علبة معدنية 800 جرام", quantity: 1,   unit: "pcs", unitCost: 2.2 },
      { materialId: "RM-007", materialName: "Can Lid",        materialNameAr: "غطاء العلبة",          quantity: 1,   unit: "pcs", unitCost: 0.6 },
    ],
  },
  {
    id: "BOM-005",
    productId: "FP-006",
    productName: "طحينة 300 جرام",
    productNameAr: "طحينة 300 جرام",
    version: "v1.0",
    effectiveDate: "2026-03-01",
    lines: [
      { materialId: "RM-011", materialName: "Sesame Seeds",  materialNameAr: "بذور السمسم", quantity: 0.5, unit: "kg", unitCost: 18.0 },
      { materialId: "RM-004", materialName: "300g Jar",      materialNameAr: "برطمان 300 جرام", quantity: 1, unit: "pcs", unitCost: 2.0 },
      { materialId: "RM-005", materialName: "Product Label", materialNameAr: "ملصق المنتج",    quantity: 1, unit: "pcs", unitCost: 0.4 },
    ],
  },
];

// ── Quality Control ───────────────────────────────────────────────────────────

export const FACTORY_QC: QualityCheck[] = [
  { id: "QC-001", productionOrderId: "MO-1001", productId: "FP-001", productName: "EVOO 500ml", batchId: "BTH-001", inspectionDate: "2026-05-10", inspector: "Laila Mansour", status: "pass", defectRate: 0.8, sampleSize: 200, failedUnits: 2, notes: "Minor cap seal issue on 2 units." },
  { id: "QC-002", productionOrderId: "MO-1002", productId: "FP-002", productName: "EVOO 1L", batchId: "BTH-002", inspectionDate: "2026-05-18", inspector: "Ahmad Qasim", status: "pass", defectRate: 0.0, sampleSize: 150, failedUnits: 0 },
  { id: "QC-003", productionOrderId: "MO-1003", productId: "FP-003", productName: "معجون طماطم 400 جرام", batchId: "BTH-003", inspectionDate: "2026-05-22", inspector: "Laila Mansour", status: "pending", defectRate: 0.0, sampleSize: 0, failedUnits: 0, notes: "Inspection scheduled after order completion." },
  { id: "QC-004", productionOrderId: "MO-1004", productId: "FP-004", productName: "حمص معلب 800 جرام", batchId: "BTH-004", inspectionDate: "2026-05-28", inspector: "Mona Ibrahim", status: "pending", defectRate: 0.0, sampleSize: 0, failedUnits: 0 },
  { id: "QC-005", productionOrderId: "MO-1007", productId: "FP-001", productName: "EVOO 500ml", batchId: "BTH-005", inspectionDate: "2026-04-21", inspector: "Ahmad Qasim", status: "fail", defectRate: 12.5, sampleSize: 120, failedUnits: 15, notes: "Acidity exceeded standard — batch destroyed." },
  { id: "QC-006", productionOrderId: "MO-1001", productId: "FP-001", productName: "EVOO 500ml", batchId: "BTH-006", inspectionDate: "2026-05-09", inspector: "Mona Ibrahim", status: "conditional", defectRate: 3.2, sampleSize: 250, failedUnits: 8, notes: "Approved with rework on 8 units — relabeling required." },
];

// ── Raw Materials ─────────────────────────────────────────────────────────────

export const RAW_MATERIALS: RawMaterial[] = [
  { id: "RM-001", name: "Fresh Olive Fruit",    nameAr: "ثمار الزيتون الطازجة",  category: "oil",       unit: "kg",  onHand: 8500,  reorderPoint: 2000,  unitCost: 12.0, supplier: "Al-Zaytoun Farm",    supplierAr: "مزرعة الزيتون",              origin: "local",    lastPurchaseDate: "2026-05-05" },
  { id: "RM-002", name: "500ml Glass Bottle",   nameAr: "زجاجة زجاجية 500مل",   category: "packaging", unit: "pcs", onHand: 15000, reorderPoint: 5000,  unitCost: 3.5,  supplier: "Glass World Ltd",    supplierAr: "جلاس وورلد المحدودة",        origin: "imported", lastPurchaseDate: "2026-04-28" },
  { id: "RM-003", name: "1L Glass Bottle",      nameAr: "زجاجة زجاجية 1 لتر",   category: "packaging", unit: "pcs", onHand: 6800,  reorderPoint: 2000,  unitCost: 5.2,  supplier: "Glass World Ltd",    supplierAr: "جلاس وورلد المحدودة",        origin: "imported", lastPurchaseDate: "2026-04-28" },
  { id: "RM-004", name: "Tin Can (assorted)",   nameAr: "علبة معدنية (متنوعة)", category: "packaging", unit: "pcs", onHand: 9200,  reorderPoint: 3000,  unitCost: 2.0,  supplier: "Metal Pack Co",      supplierAr: "شركة العبوات المعدنية",       origin: "local",    lastPurchaseDate: "2026-05-10" },
  { id: "RM-005", name: "Product Label (roll)", nameAr: "ملصق المنتج (لفة)",    category: "labeling",  unit: "pcs", onHand: 42000, reorderPoint: 10000, unitCost: 0.4,  supplier: "Print Pro",          supplierAr: "برينت برو للطباعة",           origin: "local",    lastPurchaseDate: "2026-05-01" },
  { id: "RM-006", name: "Fresh Tomatoes",       nameAr: "طماطم طازجة",           category: "oil",       unit: "kg",  onHand: 3200,  reorderPoint: 1000,  unitCost: 2.8,  supplier: "Green Valley Farms", supplierAr: "مزارع الوادي الأخضر",         origin: "local",    lastPurchaseDate: "2026-05-12" },
  { id: "RM-007", name: "Can Lid",              nameAr: "غطاء العلبة",           category: "packaging", unit: "pcs", onHand: 11000, reorderPoint: 4000,  unitCost: 0.6,  supplier: "Metal Pack Co",      supplierAr: "شركة العبوات المعدنية",       origin: "local",    lastPurchaseDate: "2026-05-10" },
  { id: "RM-008", name: "Dried Chickpeas",      nameAr: "حمص مجفف",              category: "oil",       unit: "kg",  onHand: 1800,  reorderPoint: 500,   unitCost: 6.0,  supplier: "Levant Grains",      supplierAr: "بلاد الشام للحبوب",           origin: "local",    lastPurchaseDate: "2026-05-08" },
  { id: "RM-009", name: "Dried Figs (raw)",     nameAr: "تين مجفف (خام)",        category: "oil",       unit: "kg",  onHand: 620,   reorderPoint: 200,   unitCost: 22.0, supplier: "Mountain Harvest",   supplierAr: "محاصيل الجبل",                origin: "local",    lastPurchaseDate: "2026-05-15" },
  { id: "RM-010", name: "Food-grade Bag 500g",  nameAr: "كيس غذائي 500 جرام",   category: "packaging", unit: "pcs", onHand: 5400,  reorderPoint: 2000,  unitCost: 1.2,  supplier: "Poly Pack Ltd",      supplierAr: "بولي باك المحدودة",           origin: "imported", lastPurchaseDate: "2026-05-03" },
  { id: "RM-011", name: "Sesame Seeds",         nameAr: "بذور السمسم",           category: "oil",       unit: "kg",  onHand: 420,   reorderPoint: 150,   unitCost: 18.0, supplier: "Sudan Seeds Co",     supplierAr: "سودان سيدز للبذور",           origin: "imported", lastPurchaseDate: "2026-04-20" },
  { id: "RM-012", name: "Citric Acid",          nameAr: "حمض الستريك",           category: "additives", unit: "kg",  onHand: 85,    reorderPoint: 30,    unitCost: 14.0, supplier: "Chem Direct",        supplierAr: "كيم دايركت للكيماويات",       origin: "imported", lastPurchaseDate: "2026-03-15" },
];

// ── Finished Goods ────────────────────────────────────────────────────────────

export const FINISHED_GOODS: FinishedGood[] = [
  { id: "FG-001", name: "EVOO 500ml", nameAr: "زيت زيتون بكر ممتاز 500مل", sku: "EVOO-500", category: "Oil", onHand: 2240, reserved: 480, unitCost: 10.1, sellingPrice: 18.5, productionOrderId: "MO-1001", lastProducedDate: "2026-05-10" },
  { id: "FG-002", name: "EVOO 1L", nameAr: "زيت زيتون بكر ممتاز 1 لتر", sku: "EVOO-1L", category: "Oil", onHand: 1680, reserved: 350, unitCost: 18.0, sellingPrice: 32.0, productionOrderId: "MO-1002", lastProducedDate: "2026-05-18" },
  { id: "FG-003", name: "معجون طماطم 400 جرام", nameAr: "معجون طماطم 400 جرام", sku: "TP-400", category: "Paste", onHand: 0, reserved: 0, unitCost: 7.2, sellingPrice: 12.5, productionOrderId: "MO-1003", lastProducedDate: undefined },
  { id: "FG-004", name: "حمص معلب 800 جرام", nameAr: "حمص معلب 800 جرام", sku: "CC-800", category: "Canned", onHand: 0, reserved: 0, unitCost: 9.4, sellingPrice: 16.0, productionOrderId: "MO-1004", lastProducedDate: undefined },
  { id: "FG-005", name: "تين مجفف 500 جرام", nameAr: "تين مجفف 500 جرام", sku: "DF-500", category: "Dried", onHand: 380, reserved: 80, unitCost: 23.0, sellingPrice: 38.0, lastProducedDate: "2026-04-30" },
  { id: "FG-006", name: "طحينة 300 جرام", nameAr: "طحينة 300 جرام", sku: "TAH-300", category: "Paste", onHand: 820, reserved: 200, unitCost: 11.4, sellingPrice: 19.0, lastProducedDate: "2026-04-25" },
];

// ── Warehouse Locations ───────────────────────────────────────────────────────

export const WAREHOUSE_LOCATIONS: WarehouseLocation[] = [
  { id: "WL-001", name: "Raw Materials Store A", zone: "raw", capacity: 5000, used: 3820, temperature: "Ambient (18–24°C)", notes: "Main dry storage" },
  { id: "WL-002", name: "Raw Materials Store B", zone: "raw", capacity: 3000, used: 2100, temperature: "Refrigerated (2–6°C)", notes: "Cold chain produce" },
  { id: "WL-003", name: "Packaging Store", zone: "packaging", capacity: 8000, used: 5900, notes: "Bottles, cans, labels" },
  { id: "WL-004", name: "Finished Goods A", zone: "finished", capacity: 6000, used: 5120, temperature: "Ambient (18–22°C)", notes: "Main dispatch area" },
  { id: "WL-005", name: "Finished Goods B", zone: "finished", capacity: 4000, used: 1380, temperature: "Ambient (18–22°C)" },
  { id: "WL-006", name: "Quarantine Bay", zone: "quarantine", capacity: 500, used: 120, notes: "Failed QC + recalled batches" },
];

// ── Local vs Imported Sources ─────────────────────────────────────────────────

export interface SourceRecord {
  id: string;
  materialName: string;
  materialNameAr: string;
  origin: "local" | "imported";
  supplier: string;
  supplierAr: string;
  country: string;
  countryAr: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  purchaseDate: string;
  category: string;
}

export const SOURCE_RECORDS: SourceRecord[] = [
  { id: "SRC-001", materialName: "Fresh Olive Fruit",    materialNameAr: "ثمار الزيتون",         origin: "local",    supplier: "Al-Zaytoun Farm",      supplierAr: "مزرعة الزيتون",              country: "Palestine", countryAr: "فلسطين",  quantity: 8500,  unit: "kg",  unitCost: 12.0, totalValue: 102000, purchaseDate: "2026-05-05", category: "oil" },
  { id: "SRC-002", materialName: "Fresh Tomatoes",       materialNameAr: "طماطم طازجة",           origin: "local",    supplier: "Green Valley Farms",   supplierAr: "مزارع الوادي الأخضر",       country: "Palestine", countryAr: "فلسطين",  quantity: 3200,  unit: "kg",  unitCost: 2.8,  totalValue: 8960,   purchaseDate: "2026-05-12", category: "oil" },
  { id: "SRC-003", materialName: "Dried Chickpeas",      materialNameAr: "حمص مجفف",              origin: "local",    supplier: "Levant Grains",        supplierAr: "بلاد الشام للحبوب",         country: "Palestine", countryAr: "فلسطين",  quantity: 1800,  unit: "kg",  unitCost: 6.0,  totalValue: 10800,  purchaseDate: "2026-05-08", category: "oil" },
  { id: "SRC-004", materialName: "Dried Figs",           materialNameAr: "تين مجفف",              origin: "local",    supplier: "Mountain Harvest",     supplierAr: "محاصيل الجبل",              country: "Palestine", countryAr: "فلسطين",  quantity: 620,   unit: "kg",  unitCost: 22.0, totalValue: 13640,  purchaseDate: "2026-05-15", category: "oil" },
  { id: "SRC-005", materialName: "Tin Cans (assorted)",  materialNameAr: "علب معدنية متنوعة",     origin: "local",    supplier: "Metal Pack Co",        supplierAr: "شركة العبوات المعدنية",     country: "Palestine", countryAr: "فلسطين",  quantity: 9200,  unit: "pcs", unitCost: 2.0,  totalValue: 18400,  purchaseDate: "2026-05-10", category: "packaging" },
  { id: "SRC-006", materialName: "Can Lids",             materialNameAr: "أغطية علب",             origin: "local",    supplier: "Metal Pack Co",        supplierAr: "شركة العبوات المعدنية",     country: "Palestine", countryAr: "فلسطين",  quantity: 11000, unit: "pcs", unitCost: 0.6,  totalValue: 6600,   purchaseDate: "2026-05-10", category: "packaging" },
  { id: "SRC-007", materialName: "Product Labels",       materialNameAr: "ملصقات المنتجات",       origin: "local",    supplier: "Print Pro",            supplierAr: "برينت برو للطباعة",         country: "Palestine", countryAr: "فلسطين",  quantity: 42000, unit: "pcs", unitCost: 0.4,  totalValue: 16800,  purchaseDate: "2026-05-01", category: "labeling" },
  { id: "SRC-008", materialName: "500ml Glass Bottle",   materialNameAr: "زجاجة زجاجية 500مل",   origin: "imported", supplier: "Glass World Ltd",      supplierAr: "جلاس وورلد المحدودة",       country: "Turkey",    countryAr: "تركيا",   quantity: 15000, unit: "pcs", unitCost: 3.5,  totalValue: 52500,  purchaseDate: "2026-04-28", category: "packaging" },
  { id: "SRC-009", materialName: "1L Glass Bottle",     materialNameAr: "زجاجة زجاجية 1 لتر",    origin: "imported", supplier: "Glass World Ltd",  supplierAr: "جلاس وورلد المحدودة",   country: "Turkey",  countryAr: "تركيا",   quantity: 6800, unit: "pcs", unitCost: 5.2,  totalValue: 35360, purchaseDate: "2026-04-28", category: "packaging" },
  { id: "SRC-010", materialName: "Food-grade Bag 500g", materialNameAr: "كيس غذائي 500 جرام",    origin: "imported", supplier: "Poly Pack Ltd",   supplierAr: "بولي باك المحدودة",     country: "Egypt",   countryAr: "مصر",     quantity: 5400, unit: "pcs", unitCost: 1.2,  totalValue: 6480,  purchaseDate: "2026-05-03", category: "packaging" },
  { id: "SRC-011", materialName: "Sesame Seeds",        materialNameAr: "بذور السمسم",            origin: "imported", supplier: "Sudan Seeds Co",  supplierAr: "سودان سيدز للبذور",     country: "Sudan",   countryAr: "السودان", quantity: 420,  unit: "kg",  unitCost: 18.0, totalValue: 7560,  purchaseDate: "2026-04-20", category: "oil" },
  { id: "SRC-012", materialName: "Citric Acid",         materialNameAr: "حمض الستريك",            origin: "imported", supplier: "Chem Direct",     supplierAr: "كيم دايركت للكيماويات", country: "Germany", countryAr: "ألمانيا", quantity: 85,   unit: "kg",  unitCost: 14.0, totalValue: 1190,  purchaseDate: "2026-03-15", category: "additives" },
];

// ── Import Orders ─────────────────────────────────────────────────────────────

export const IMPORT_ORDERS: ImportOrder[] = [
  {
    id: "IMP-001",
    supplierName: "Glass World Ltd",
    origin: "Turkey",
    items: [
      { name: "500ml Glass Bottle", quantity: 15000, unit: "pcs", unitCost: 3.5 },
      { name: "1L Glass Bottle", quantity: 6800, unit: "pcs", unitCost: 5.2 },
    ],
    totalValue: 87860,
    currency: "USD",
    orderDate: "2026-04-10",
    estimatedArrival: "2026-04-28",
    actualArrival: "2026-04-28",
    status: "received",
    customsRef: "CUS-20260428-001",
  },
  {
    id: "IMP-002",
    supplierName: "Sudan Seeds Co",
    origin: "Sudan",
    items: [
      { name: "Sesame Seeds", quantity: 420, unit: "kg", unitCost: 18.0 },
    ],
    totalValue: 7560,
    currency: "USD",
    orderDate: "2026-04-05",
    estimatedArrival: "2026-04-20",
    actualArrival: "2026-04-20",
    status: "received",
    customsRef: "CUS-20260420-002",
  },
  {
    id: "IMP-003",
    supplierName: "Poly Pack Ltd",
    origin: "Egypt",
    items: [
      { name: "Food-grade Bag 500g", quantity: 5400, unit: "pcs", unitCost: 1.2 },
    ],
    totalValue: 6480,
    currency: "USD",
    orderDate: "2026-04-22",
    estimatedArrival: "2026-05-03",
    actualArrival: "2026-05-03",
    status: "received",
    customsRef: "CUS-20260503-001",
  },
  {
    id: "IMP-004",
    supplierName: "Chem Direct",
    origin: "Germany",
    items: [
      { name: "Citric Acid", quantity: 85, unit: "kg", unitCost: 14.0 },
    ],
    totalValue: 1190,
    currency: "EUR",
    orderDate: "2026-02-28",
    estimatedArrival: "2026-03-15",
    actualArrival: "2026-03-15",
    status: "received",
    customsRef: "CUS-20260315-003",
  },
  {
    id: "IMP-005",
    supplierName: "Glass World Ltd",
    origin: "Turkey",
    items: [
      { name: "500ml Glass Bottle", quantity: 20000, unit: "pcs", unitCost: 3.4 },
      { name: "1L Glass Bottle", quantity: 10000, unit: "pcs", unitCost: 5.0 },
    ],
    totalValue: 118000,
    currency: "USD",
    orderDate: "2026-05-15",
    estimatedArrival: "2026-06-05",
    status: "in-transit",
    customsRef: undefined,
    notes: "On vessel MV Aphrodite — ETA Ashdod port Jun 3.",
  },
  {
    id: "IMP-006",
    supplierName: "Sudan Seeds Co",
    origin: "Sudan",
    items: [
      { name: "Sesame Seeds", quantity: 800, unit: "kg", unitCost: 17.5 },
    ],
    totalValue: 14000,
    currency: "USD",
    orderDate: "2026-05-20",
    estimatedArrival: "2026-06-12",
    status: "ordered",
  },
  {
    id: "IMP-007",
    supplierName: "Poly Pack Ltd",
    origin: "Egypt",
    items: [
      { name: "Food-grade Bag 500g", quantity: 10000, unit: "pcs", unitCost: 1.15 },
    ],
    totalValue: 11500,
    currency: "USD",
    orderDate: "2026-05-22",
    estimatedArrival: "2026-06-01",
    status: "customs",
    customsRef: "CUS-20260601-002",
    notes: "Held at Haifa port for document review.",
  },
];

// ── Production Batches ────────────────────────────────────────────────────────

export const PRODUCTION_BATCHES: ProductionBatch[] = [
  { id: "BTH-001", productionOrderId: "MO-1001", productName: "EVOO 500ml", quantity: 2400, producedDate: "2026-05-10", expiryDate: "2027-05-10", status: "closed", qcStatus: "pass", unitCost: 10.1, totalCost: 24240 },
  { id: "BTH-002", productionOrderId: "MO-1002", productName: "EVOO 1L", quantity: 1800, producedDate: "2026-05-18", expiryDate: "2027-05-18", status: "closed", qcStatus: "pass", unitCost: 18.0, totalCost: 32400 },
  { id: "BTH-003", productionOrderId: "MO-1003", productName: "معجون طماطم 400 جرام", quantity: 0, producedDate: "", expiryDate: "", status: "open", qcStatus: "pending", unitCost: 7.2, totalCost: 0, notes: "Production in progress." },
  { id: "BTH-004", productionOrderId: "MO-1004", productName: "حمص معلب 800 جرام", quantity: 0, producedDate: "", expiryDate: "", status: "open", qcStatus: "pending", unitCost: 9.4, totalCost: 0 },
  { id: "BTH-005", productionOrderId: "MO-1007", productName: "EVOO 500ml", quantity: 600, producedDate: "2026-04-21", expiryDate: "2027-04-21", status: "quarantine", qcStatus: "fail", unitCost: 10.1, totalCost: 6060, notes: "Batch failed acidity QC — under review." },
  { id: "BTH-006", productionOrderId: "MO-1001", productName: "EVOO 500ml (rework)", quantity: 2392, producedDate: "2026-05-10", expiryDate: "2027-05-10", status: "closed", qcStatus: "conditional", unitCost: 10.3, totalCost: 24638, notes: "8 units relabeled and reapproved." },
];

// ── Costing ───────────────────────────────────────────────────────────────────

export const COSTING_ENTRIES: CostingEntry[] = [
  { id: "CST-001", productionOrderId: "MO-1001", productName: "EVOO 500ml", period: "2026-05", rawMaterialCost: 16800, laborCost: 3200, overheadCost: 4240, totalCost: 24240, unitsProduced: 2400, costPerUnit: 10.1, variance: -360 },
  { id: "CST-002", productionOrderId: "MO-1002", productName: "EVOO 1L", period: "2026-05", rawMaterialCost: 22600, laborCost: 4800, overheadCost: 5000, totalCost: 32400, unitsProduced: 1800, costPerUnit: 18.0, variance: 200 },
  { id: "CST-003", productionOrderId: "MO-1003", productName: "معجون طماطم 400 جرام", period: "2026-05", rawMaterialCost: 0, laborCost: 0, overheadCost: 0, totalCost: 0, unitsProduced: 0, costPerUnit: 0, variance: 0 },
  { id: "CST-004", productionOrderId: "MO-1004", productName: "حمص معلب 800 جرام", period: "2026-05", rawMaterialCost: 0, laborCost: 0, overheadCost: 0, totalCost: 0, unitsProduced: 0, costPerUnit: 0, variance: 0 },
  { id: "CST-005", productionOrderId: "MO-1007", productName: "EVOO 500ml", period: "2026-04", rawMaterialCost: 4200, laborCost: 1200, overheadCost: 660, totalCost: 6060, unitsProduced: 600, costPerUnit: 10.1, variance: 560 },
];

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

export const FACTORY_DASHBOARD_KPI = {
  activeOrders:     FACTORY_ORDERS.filter((o) => o.status === "in-progress").length,
  plannedOrders:    FACTORY_ORDERS.filter((o) => o.status === "planned").length,
  completedOrders:  FACTORY_ORDERS.filter((o) => o.status === "done").length,
  qcPassRate:       Math.round(FACTORY_QC.filter((q) => q.status === "pass").length / FACTORY_QC.filter((q) => q.status !== "pending").length * 100),
  rawMaterialAlerts: RAW_MATERIALS.filter((r) => r.onHand <= r.reorderPoint).length,
  openImports:      IMPORT_ORDERS.filter((i) => i.status !== "received" && i.status !== "cancelled").length,
  openBatches:      PRODUCTION_BATCHES.filter((b) => b.status === "open").length,
  totalFinishedOnHand: FINISHED_GOODS.reduce((s, g) => s + g.onHand, 0),
};
