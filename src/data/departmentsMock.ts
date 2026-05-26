import { type Department } from "./types";

export const DEPARTMENTS: Department[] = [
  { id: "dept-01", name: "Executive",    nameAr: "الإدارة التنفيذية", headId: "EMP-001", headName: "Walid Karimi",   parentId: undefined, headcount: 3,  openPositions: 0, monthlyRevenue: 0,      status: "active" },
  { id: "dept-02", name: "Sales",        nameAr: "المبيعات",          headId: "EMP-010", headName: "Ahmad Qasim",   parentId: undefined, headcount: 12, openPositions: 2, monthlyRevenue: 185000, status: "active" },
  { id: "dept-03", name: "Operations",   nameAr: "العمليات",          headId: "EMP-015", headName: "Mona Ibrahim",  parentId: undefined, headcount: 8,  openPositions: 1, monthlyRevenue: 0,      status: "active" },
  { id: "dept-04", name: "Finance",      nameAr: "المالية",           headId: "EMP-020", headName: "Karim Nasser",  parentId: undefined, headcount: 5,  openPositions: 0, monthlyRevenue: 0,      status: "active" },
  { id: "dept-05", name: "HR",           nameAr: "الموارد البشرية",   headId: "EMP-025", headName: "Laila Mansour", parentId: undefined, headcount: 4,  openPositions: 1, monthlyRevenue: 0,      status: "active" },
  { id: "dept-06", name: "IT",           nameAr: "تقنية المعلومات",  headId: "EMP-030", headName: "Hana Saeed",    parentId: undefined, headcount: 6,  openPositions: 2, monthlyRevenue: 0,      status: "active" },
  { id: "dept-07", name: "POS / Retail", nameAr: "نقاط البيع",        headId: "EMP-035", headName: "Omar Haddad",   parentId: "dept-02", headcount: 10, openPositions: 1, monthlyRevenue: 95000,  status: "active" },
  { id: "dept-08", name: "Warehouse",    nameAr: "المستودع",          headId: "EMP-040", headName: "Dina Saleh",    parentId: "dept-03", headcount: 7,  openPositions: 0, monthlyRevenue: 0,      status: "active" },
];
