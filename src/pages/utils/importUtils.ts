import type {
  Customer,
  Invoice,
  InvoiceItem,
  Payment,
  PaymentMethod,
  Product,
} from "../../data/types";

import {
  getCustomers,
  saveCustomers,
  getProducts,
  saveProducts,
  getInvoices,
  saveInvoices,
  getPayments,
  savePayments,
} from "../../data/storage";

type ImportEntity = "customers" | "products" | "invoices" | "payments";
type ParsedRow = Record<string, string>;

type ImportResult = {
  importedCount: number;
  skippedCount: number;
  message: string;
};

function normalizeText(value: string) {
  return String(value || "").trim();
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeNumber(value: string, fallback = 0) {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : roundMoney(num);
}

function multiplyMoney(a: number, b: number): number {
  return roundMoney(a * b);
}

function addMoney(a: number, b: number): number {
  return roundMoney(a + b);
}

function buildId(prefix: string, currentLength: number, start = 1000) {
  return `${prefix}-${start + currentLength + 1}`;
}

function normalizePaymentMethod(value: string): PaymentMethod {
  const normalized = normalizeText(value).toLowerCase();

  if (normalized === "cash") return "Cash";
  if (normalized === "card") return "Card";
  if (normalized === "bank transfer") return "Bank Transfer";

  return "Cash";
}

export function importValidRowsIntoSystem(
  entity: ImportEntity,
  rows: ParsedRow[]
): ImportResult {
  if (!rows.length) {
    return {
      importedCount: 0,
      skippedCount: 0,
      message: "No valid rows available for import.",
    };
  }

  if (entity === "customers") {
    const existing = getCustomers();
    const existingPhones = new Set(existing.map((c) => String(c.phone || "").trim()));
    const existingNames = new Set(
      existing.map((c) => String(c.name || "").trim().toLowerCase())
    );

    const prepared: Customer[] = [];
    let skipped = 0;

    for (const row of rows) {
      const phone = normalizeText(row.phone || "");
      const name = normalizeText(row.name || "");

      if (!name || !phone) {
        skipped += 1;
        continue;
      }

      if (existingPhones.has(phone) || existingNames.has(name.toLowerCase())) {
        skipped += 1;
        continue;
      }

      prepared.push({
        id:
          normalizeText(row.id || "") ||
          buildId("CUST", existing.length + prepared.length),
        name,
        email: normalizeText(row.email || ""),
        phone,
        location: normalizeText(row.location || ""),
        address: normalizeText(row.address || row.location || ""),
        notes: normalizeText(row.notes || ""),
        joinedAt: new Date().toISOString().split("T")[0],
        isDeleted: false,
      });
    }

    saveCustomers([...prepared, ...existing]);

    return {
      importedCount: prepared.length,
      skippedCount: skipped,
      message: `${prepared.length} customer(s) imported successfully.`,
    };
  }

  if (entity === "products") {
    const existing = getProducts();
    const existingNames = new Set(
      existing.map((p) => String(p.name || "").trim().toLowerCase())
    );

    const prepared: Product[] = [];
    let skipped = 0;

    for (const row of rows) {
      const name = normalizeText(row.name || "");

      if (!name) {
        skipped += 1;
        continue;
      }

      if (existingNames.has(name.toLowerCase())) {
        skipped += 1;
        continue;
      }

      prepared.push({
        id:
          normalizeText(row.id || "") ||
          buildId("PROD", existing.length + prepared.length),
        name,
        category: normalizeText(row.category || ""),
        price: normalizeNumber(row.price),
        stock: normalizeNumber(row.stock),
        addedAt: Date.now(),
      } as Product);
    }

    saveProducts([...prepared, ...existing]);

    return {
      importedCount: prepared.length,
      skippedCount: skipped,
      message: `${prepared.length} product(s) imported successfully.`,
    };
  }

  if (entity === "invoices") {
    const existing = getInvoices();
    const existingIds = new Set(existing.map((inv) => String(inv.id || "").trim()));

    const grouped = new Map<
      string,
      {
        id: string;
        customerId: string;
        date: string;
        notes: string;
        items: {
          productId: string;
          quantity: number;
          unitPrice: number;
        }[];
      }
    >();

    let skipped = 0;

    for (const row of rows) {
      const invoiceId =
        normalizeText(row.id || "") ||
        buildId("INV", existing.length + grouped.size);

      if (existingIds.has(invoiceId)) {
        skipped += 1;
        continue;
      }

      if (!grouped.has(invoiceId)) {
        grouped.set(invoiceId, {
          id: invoiceId,
          customerId: normalizeText(row.customer_id || ""),
          date: normalizeText(row.date || new Date().toISOString().split("T")[0]),
          notes: normalizeText(row.notes || ""),
          items: [],
        });
      }

      grouped.get(invoiceId)?.items.push({
        productId: normalizeText(row.product_id || ""),
        quantity: normalizeNumber(row.quantity),
        unitPrice: normalizeNumber(row.unit_price),
      });
    }

    const prepared: Invoice[] = Array.from(grouped.values()).map((invoice) => {
      const items: InvoiceItem[] = invoice.items.map((item, index) => ({
        id: `INVITEM-${invoice.id}-${index + 1}`,
        invoiceId: invoice.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: multiplyMoney(item.quantity, item.unitPrice),
      }));

      const total = items.reduce((sum, item) => addMoney(sum, item.total), 0);

      return {
        id: invoice.id,
        customerId: invoice.customerId,
        date: invoice.date,
        notes: invoice.notes,
        items,
        total,
      } as Invoice;
    });

    saveInvoices([...prepared, ...existing]);

    return {
      importedCount: prepared.length,
      skippedCount: skipped,
      message: `${prepared.length} invoice(s) imported successfully.`,
    };
  }

  if (entity === "payments") {
    const existing = getPayments();
    const existingIds = new Set(existing.map((payment) => String(payment.id || "").trim()));
    const invoices = getInvoices();

    const prepared: Payment[] = [];
    let skipped = 0;

    for (const row of rows) {
      const paymentId =
        normalizeText(row.payment_id || "") ||
        buildId("PAY", existing.length + prepared.length, 2000);

      if (existingIds.has(paymentId)) {
        skipped += 1;
        continue;
      }

      const invoiceId = normalizeText(row.invoice_id || "");
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      const amount = normalizeNumber(row.amount);

      prepared.push({
        id: paymentId,
        invoiceId,
        customerId: normalizeText(row.customer_id || invoice?.customerId || ""),
        amount,
        method: normalizePaymentMethod(row.method || "Cash"),
        date: normalizeText(row.date || new Date().toISOString().split("T")[0]),
        notes: normalizeText(row.notes || ""),
      } as Payment);
    }

    savePayments([...prepared, ...existing]);

    return {
      importedCount: prepared.length,
      skippedCount: skipped,
      message: `${prepared.length} payment(s) imported successfully.`,
    };
  }

  return {
    importedCount: 0,
    skippedCount: 0,
    message: "Unsupported import type.",
  };
}