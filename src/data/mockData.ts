export const dashboardStats = [
  { title: "Total Sales", value: "$12,450" },
  { title: "Customers", value: "245" },
  { title: "Invoices", value: "38" },
  { title: "Products", value: "124" },
];

export const customersData = [
  { name: "Osid Barakat", address: "Palestine", phone: "0590000000" },
  { name: "Mahmoud Kharouf", address: "Palestine", phone: "0561231231" },
  { name: "Saleem", address: "Tulkarm", phone: "0561231231" },
];

export const productsData = [
  { name: "Laptop", price: "$1200" },
  { name: "Phone", price: "$800" },
  { name: "Monitor", price: "$350" },
  { name: "Keyboard", price: "$90" },
];

export const purchasesData = [
  { customer: "Osid Barakat", product: "Laptop", quantity: "2", total: "$2400" },
  { customer: "Mahmoud Kharouf", product: "Phone", quantity: "1", total: "$800" },
  { customer: "Saleem", product: "Monitor", quantity: "3", total: "$1050" },
];

export const invoicesData = [
  { number: "#INV-1001", customer: "Osid Barakat", status: "Paid", total: "$2400" },
  { number: "#INV-1002", customer: "Mahmoud Kharouf", status: "Pending", total: "$800" },
  { number: "#INV-1003", customer: "Saleem", status: "Partial", total: "$1050" },
];

export const paymentsData = [
  { customer: "Osid Barakat", method: "Cash", date: "2026-04-03", amount: "$2400" },
  { customer: "Mahmoud Kharouf", method: "Card", date: "2026-04-02", amount: "$800" },
  { customer: "Saleem", method: "Bank Transfer", date: "2026-04-01", amount: "$1050" },
];
export const recentInvoices = [
  { number: "#INV-1001", customer: "Osid Barakat", status: "Paid", total: "$2400" },
  { number: "#INV-1002", customer: "Mahmoud Kharouf", status: "Pending", total: "$800" },
  { number: "#INV-1003", customer: "Saleem", status: "Partial", total: "$1050" },
];

export const recentPayments = [
  { customer: "Osid Barakat", method: "Cash", amount: "$2400" },
  { customer: "Mahmoud Kharouf", method: "Card", amount: "$800" },
  { customer: "Saleem", method: "Bank Transfer", amount: "$1050" },
];