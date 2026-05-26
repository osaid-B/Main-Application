import type { Expense } from "./types";

export const EXPENSES: Expense[] = [
  { id: "EX-5001", date: "2026-05-01", category: "Rent", amount: 5000, currency: "ILS", vendor: "Al-Ameen Properties", paymentMethod: "bank", notes: "Office rent May 2026" },
  { id: "EX-5002", date: "2026-05-03", category: "Utilities", amount: 720, currency: "ILS", vendor: "Palestine Electric", paymentMethod: "bank" },
  { id: "EX-5003", date: "2026-05-05", category: "Office Supplies", amount: 340, currency: "ILS", vendor: "Stationary Plus", paymentMethod: "cash" },
  { id: "EX-5004", date: "2026-05-08", category: "Travel", amount: 1200, currency: "ILS", vendor: "Local Transport", paymentMethod: "cash", notes: "Team site visit" },
  { id: "EX-5005", date: "2026-05-10", category: "Marketing", amount: 3500, currency: "USD", vendor: "Digital Ads Agency", paymentMethod: "card" },
  { id: "EX-5006", date: "2026-05-12", category: "Maintenance", amount: 850, currency: "ILS", vendor: "Fix-It Services", paymentMethod: "cash" },
  { id: "EX-5007", date: "2026-05-15", category: "Internet & Telecom", amount: 480, currency: "ILS", vendor: "Paltel", paymentMethod: "bank" },
  { id: "EX-5008", date: "2026-05-18", category: "Insurance", amount: 2100, currency: "ILS", vendor: "Al-Watania Insurance", paymentMethod: "cheque", notes: "Annual policy renewal" },
  { id: "EX-5009", date: "2026-05-20", category: "Software Subscriptions", amount: 299, currency: "USD", vendor: "Various SaaS", paymentMethod: "card" },
  { id: "EX-5010", date: "2026-05-22", category: "Cleaning", amount: 250, currency: "ILS", vendor: "Clean Co.", paymentMethod: "cash" },
];
