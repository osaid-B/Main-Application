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
  return status === "Completed" || status === "Paid" || status === "Partial";
}

export function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
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

export function getInvoiceTotal(invoice: Invoice) {
  return roundMoney(Number(invoice?.total ?? 0));
}

export function calculateInvoicePaidAmount(
  invoiceId: string,
  payments: Payment[]
) {
  const paid = getSuccessfulPaymentsByInvoiceId(payments, invoiceId).reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  return roundMoney(paid);
}

export function calculateInvoiceRemainingAmount(
  invoice: Invoice,
  payments: Payment[]
) {
  const total = getInvoiceTotal(invoice);
  const paid = calculateInvoicePaidAmount(invoice.id, payments);
  const remaining = total - paid;

  return roundMoney(Math.max(remaining, 0));
}

export function calculateInvoiceStatus(
  invoice: Invoice,
  payments: Payment[]
): "Paid" | "Partial" | "Debit" {
  const total = getInvoiceTotal(invoice);
  const paid = calculateInvoicePaidAmount(invoice.id, payments);
  const remaining = calculateInvoiceRemainingAmount(invoice, payments);

  if (total <= 0) return "Debit";
  if (paid <= 0) return "Debit";
  if (remaining <= 0) return "Paid";
  return "Partial";
}

export function buildInvoicesWithRelations(
  invoices: Invoice[],
  customers: Customer[],
  payments: Payment[]
) {
  return invoices.map((invoice) => {
    const customer = getCustomerById(customers, invoice.customerId);
    const total = getInvoiceTotal(invoice);
    const paidAmount = Math.min(
      calculateInvoicePaidAmount(invoice.id, payments),
      total
    );
    const remainingAmount = calculateInvoiceRemainingAmount(invoice, payments);
    const status = calculateInvoiceStatus(invoice, payments);

    return {
      ...invoice,
      customerName: customer?.name ?? "Unknown Customer",
      total,
      paidAmount,
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
  return roundMoney(
    invoiceItems
      .filter((item) => item.invoiceId === invoiceId)
      .reduce((sum, item) => sum + Number(item.total || 0), 0)
  );
}
