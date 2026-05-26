import type { JournalEntry } from "./types";

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "JE-1001",
    date: "2026-05-01",
    reference: "REF-001",
    description: "Monthly rent payment",
    lines: [
      { accountId: "6100", debit: 5000, credit: 0, memo: "Office rent May" },
      { accountId: "1000", debit: 0, credit: 5000, memo: "Bank payment" },
    ],
    status: "posted",
    postedBy: "Admin",
  },
  {
    id: "JE-1002",
    date: "2026-05-05",
    reference: "REF-002",
    description: "Sales revenue recognition",
    lines: [
      { accountId: "1200", debit: 18500, credit: 0 },
      { accountId: "4000", debit: 0, credit: 18500 },
    ],
    status: "posted",
    postedBy: "Finance",
  },
  {
    id: "JE-1003",
    date: "2026-05-10",
    reference: "REF-003",
    description: "Supplier invoice — raw materials",
    lines: [
      { accountId: "5000", debit: 9200, credit: 0, memo: "COGS adjustment" },
      { accountId: "2000", debit: 0, credit: 9200, memo: "Accounts payable" },
    ],
    status: "posted",
    postedBy: "Finance",
  },
  {
    id: "JE-1004",
    date: "2026-05-15",
    reference: "REF-004",
    description: "Payroll — May first half",
    lines: [
      { accountId: "6200", debit: 12000, credit: 0 },
      { accountId: "1000", debit: 0, credit: 12000 },
    ],
    status: "posted",
    postedBy: "HR",
  },
  {
    id: "JE-1005",
    date: "2026-05-20",
    reference: "REF-005",
    description: "Depreciation — equipment",
    lines: [
      { accountId: "6300", debit: 800, credit: 0 },
      { accountId: "1500", debit: 0, credit: 800 },
    ],
    status: "draft",
  },
];
