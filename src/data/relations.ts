import type {
  Customer,
  Invoice,
  InvoiceItem,
  Payment,
  Product,
  Purchase,
  Supplier,
} from "./types";

export function isSuccessfulPaymentStatus(status?: string) {
  return status === "Completed" || status === "Paid";
}

export function getCustomerById(customers: Customer[], customerId: string) {
  return customers.find((customer) => customer.id === customerId);
}

export function getSupplierById(suppliers: Supplier[], supplierId: string) {
  return suppliers.find((supplier) => supplier.id === supplierId);
}

export function getProductById(products: Product[], productId: string) {
  return products.find((product) => product.id === productId);
}

export function getInvoiceById(invoices: Invoice[], invoiceId: string) {
  return invoices.find((invoice) => invoice.id === invoiceId);
}

export function getPaymentsByInvoiceId(payments: Payment[], invoiceId: string) {
  return payments.filter((payment) => payment.invoiceId === invoiceId);
}

export function getSuccessfulPaymentsByInvoiceId(
  payments: Payment[],
  invoiceId: string
) {
  return payments.filter(
    (payment) =>
      payment.invoiceId === invoiceId && isSuccessfulPaymentStatus(payment.status)
  );
}

export function calculateInvoicePaidAmount(
  invoiceId: string,
  payments: Payment[]
) {
  return getSuccessfulPaymentsByInvoiceId(payments, invoiceId).reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
}

export function calculateInvoiceRemainingAmount(
  invoice: Invoice,
  payments: Payment[]
) {
  const paid = calculateInvoicePaidAmount(invoice.id, payments);
  return Math.max(Number(invoice.amount || 0) - paid, 0);
}

export function calculateInvoiceStatus(
  invoice: Invoice,
  payments: Payment[]
): "Paid" | "Partial" | "Debit" {
  const total = Number(invoice.amount || 0);
  const paid = calculateInvoicePaidAmount(invoice.id, payments);
  const remaining = Math.max(total - paid, 0);

  if (remaining === 0) return "Paid";
  if (paid > 0 && remaining > 0) return "Partial";
  return "Debit";
}

export function buildInvoicesWithRelations(
  invoices: Invoice[],
  customers: Customer[],
  payments: Payment[]
) {
  return invoices.map((invoice) => {
    const customer = getCustomerById(customers, invoice.customerId);
    const remainingAmount = calculateInvoiceRemainingAmount(invoice, payments);
    const status = calculateInvoiceStatus(invoice, payments);

    return {
      ...invoice,
      customerName: customer?.name ?? "Unknown Customer",
      remainingAmount,
      status,
    };
  });
}

export function buildPaymentsWithRelations(
  payments: Payment[],
  invoices: Invoice[],
  customers: Customer[]
) {
  return payments.map((payment) => {
    const invoice = getInvoiceById(invoices, payment.invoiceId);
    const customer = getCustomerById(customers, payment.customerId);

    return {
      ...payment,
      invoiceNumber: invoice?.id ?? payment.invoiceId,
      customerName: customer?.name ?? "Unknown Customer",
    };
  });
}

export function buildPurchasesWithRelations(
  purchases: Purchase[],
  suppliers: Supplier[],
  products: Product[]
) {
  return purchases.map((purchase) => {
    const supplier = getSupplierById(suppliers, purchase.supplierId);
    const product = getProductById(products, purchase.productId);

    return {
      ...purchase,
      supplierName: supplier?.name ?? "Unknown Supplier",
      productName: product?.name ?? "Unknown Product",
    };
  });
}

export function calculateProductSoldQuantity(
  productId: string,
  invoiceItems: InvoiceItem[]
) {
  return invoiceItems
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export function calculateInvoiceTotalFromItems(
  invoiceId: string,
  invoiceItems: InvoiceItem[]
) {
  return invoiceItems
    .filter((item) => item.invoiceId === invoiceId)
    .reduce((sum, item) => sum + Number(item.total || 0), 0);
}