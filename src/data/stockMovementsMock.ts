import type { StockMovement } from "./types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const STOCK_MOVEMENTS_MOCK: StockMovement[] = [
  // Receives
  { id: "MV-001", productId: "PRD-001", productName: "قهوة عربية 250g", type: "receive",    quantityIn: 50,  quantityOut: 0,  stockAfter: 120, reference: "PO-2401", reason: "استلام من المورد",    date: daysAgo(58), createdBy: "أحمد قاسم" },
  { id: "MV-002", productId: "PRD-002", productName: "شاي أخضر 100g",  type: "receive",    quantityIn: 80,  quantityOut: 0,  stockAfter: 200, reference: "PO-2402", reason: "استلام من المورد",    date: daysAgo(55), createdBy: "سارة حداد" },
  { id: "MV-003", productId: "PRD-003", productName: "عصير برتقال 1L", type: "receive",    quantityIn: 120, quantityOut: 0,  stockAfter: 300, reference: "PO-2403", reason: "استلام من المورد",    date: daysAgo(52), createdBy: "أحمد قاسم" },
  { id: "MV-004", productId: "PRD-004", productName: "مياه معدنية 500ml", type: "receive", quantityIn: 200, quantityOut: 0,  stockAfter: 500, reference: "PO-2404", reason: "استلام من المورد",    date: daysAgo(50), createdBy: "طارق منصور" },
  { id: "MV-005", productId: "PRD-005", productName: "كيك شوكولاتة",   type: "receive",    quantityIn: 30,  quantityOut: 0,  stockAfter: 80,  reference: "PO-2405", reason: "استلام من المورد",    date: daysAgo(48), createdBy: "سارة حداد" },
  // Issues (sales)
  { id: "MV-006", productId: "PRD-001", productName: "قهوة عربية 250g", type: "issue",     quantityIn: 0,   quantityOut: 15, stockAfter: 105, reference: "INV-1001", reason: "بيع",               date: daysAgo(47), createdBy: "أحمد قاسم" },
  { id: "MV-007", productId: "PRD-002", productName: "شاي أخضر 100g",  type: "issue",     quantityIn: 0,   quantityOut: 20, stockAfter: 180, reference: "INV-1002", reason: "بيع",               date: daysAgo(46), createdBy: "سارة حداد" },
  { id: "MV-008", productId: "PRD-003", productName: "عصير برتقال 1L", type: "issue",     quantityIn: 0,   quantityOut: 35, stockAfter: 265, reference: "INV-1003", reason: "بيع",               date: daysAgo(45), createdBy: "طارق منصور" },
  { id: "MV-009", productId: "PRD-001", productName: "قهوة عربية 250g", type: "issue",     quantityIn: 0,   quantityOut: 10, stockAfter: 95,  reference: "INV-1004", reason: "بيع",               date: daysAgo(44), createdBy: "أحمد قاسم" },
  { id: "MV-010", productId: "PRD-004", productName: "مياه معدنية 500ml", type: "issue",  quantityIn: 0,   quantityOut: 50, stockAfter: 450, reference: "INV-1005", reason: "بيع",               date: daysAgo(43), createdBy: "لينا بركات" },
  // Receives
  { id: "MV-011", productId: "PRD-006", productName: "كنافة بالجبن",   type: "receive",    quantityIn: 40,  quantityOut: 0,  stockAfter: 40,  reference: "PO-2406", reason: "استلام من المورد",    date: daysAgo(42), createdBy: "سارة حداد" },
  { id: "MV-012", productId: "PRD-007", productName: "معمول تمر",      type: "receive",    quantityIn: 60,  quantityOut: 0,  stockAfter: 60,  reference: "PO-2407", reason: "استلام من المورد",    date: daysAgo(40), createdBy: "أحمد قاسم" },
  // Issues
  { id: "MV-013", productId: "PRD-005", productName: "كيك شوكولاتة",   type: "issue",     quantityIn: 0,   quantityOut: 12, stockAfter: 68,  reference: "INV-1006", reason: "بيع",               date: daysAgo(39), createdBy: "طارق منصور" },
  { id: "MV-014", productId: "PRD-006", productName: "كنافة بالجبن",   type: "issue",     quantityIn: 0,   quantityOut: 8,  stockAfter: 32,  reference: "INV-1007", reason: "بيع",               date: daysAgo(38), createdBy: "لينا بركات" },
  { id: "MV-015", productId: "PRD-002", productName: "شاي أخضر 100g",  type: "issue",     quantityIn: 0,   quantityOut: 25, stockAfter: 155, reference: "INV-1008", reason: "بيع",               date: daysAgo(37), createdBy: "سارة حداد" },
  // Adjustments
  { id: "MV-016", productId: "PRD-003", productName: "عصير برتقال 1L", type: "adjustment",quantityIn: 5,   quantityOut: 0,  stockAfter: 270, reference: "ADJ-001",  reason: "تسوية جرد - فرق عد", date: daysAgo(36), createdBy: "أحمد قاسم" },
  { id: "MV-017", productId: "PRD-007", productName: "معمول تمر",      type: "issue",     quantityIn: 0,   quantityOut: 15, stockAfter: 45,  reference: "INV-1009", reason: "بيع",               date: daysAgo(35), createdBy: "طارق منصور" },
  { id: "MV-018", productId: "PRD-001", productName: "قهوة عربية 250g", type: "receive",   quantityIn: 30,  quantityOut: 0,  stockAfter: 125, reference: "PO-2408", reason: "استلام من المورد",    date: daysAgo(34), createdBy: "سارة حداد" },
  { id: "MV-019", productId: "PRD-004", productName: "مياه معدنية 500ml", type: "issue",  quantityIn: 0,   quantityOut: 80, stockAfter: 370, reference: "INV-1010", reason: "بيع",               date: daysAgo(33), createdBy: "لينا بركات" },
  // Damage
  { id: "MV-020", productId: "PRD-005", productName: "كيك شوكولاتة",   type: "damage",    quantityIn: 0,   quantityOut: 5,  stockAfter: 63,  reference: "DMG-001",  reason: "تلف - انتهاء صلاحية",date: daysAgo(32), createdBy: "أحمد قاسم" },
  { id: "MV-021", productId: "PRD-006", productName: "كنافة بالجبن",   type: "issue",     quantityIn: 0,   quantityOut: 10, stockAfter: 22,  reference: "INV-1011", reason: "بيع",               date: daysAgo(31), createdBy: "طارق منصور" },
  { id: "MV-022", productId: "PRD-003", productName: "عصير برتقال 1L", type: "issue",     quantityIn: 0,   quantityOut: 40, stockAfter: 230, reference: "INV-1012", reason: "بيع",               date: daysAgo(30), createdBy: "سارة حداد" },
  { id: "MV-023", productId: "PRD-008", productName: "زيت زيتون 750ml",type: "receive",    quantityIn: 50,  quantityOut: 0,  stockAfter: 50,  reference: "PO-2409", reason: "استلام من المورد",    date: daysAgo(29), createdBy: "أحمد قاسم" },
  { id: "MV-024", productId: "PRD-002", productName: "شاي أخضر 100g",  type: "receive",   quantityIn: 60,  quantityOut: 0,  stockAfter: 215, reference: "PO-2410", reason: "استلام من المورد",    date: daysAgo(28), createdBy: "لينا بركات" },
  { id: "MV-025", productId: "PRD-007", productName: "معمول تمر",      type: "issue",     quantityIn: 0,   quantityOut: 20, stockAfter: 25,  reference: "INV-1013", reason: "بيع",               date: daysAgo(27), createdBy: "طارق منصور" },
  { id: "MV-026", productId: "PRD-001", productName: "قهوة عربية 250g", type: "issue",    quantityIn: 0,   quantityOut: 18, stockAfter: 107, reference: "INV-1014", reason: "بيع",               date: daysAgo(26), createdBy: "سارة حداد" },
  { id: "MV-027", productId: "PRD-008", productName: "زيت زيتون 750ml",type: "issue",     quantityIn: 0,   quantityOut: 12, stockAfter: 38,  reference: "INV-1015", reason: "بيع",               date: daysAgo(25), createdBy: "أحمد قاسم" },
  // Adjustment for stock count
  { id: "MV-028", productId: "PRD-004", productName: "مياه معدنية 500ml",type:"adjustment",quantityIn: 10,  quantityOut: 0,  stockAfter: 380, reference: "ADJ-002",  reason: "تسوية جرد دورية",    date: daysAgo(24), createdBy: "أحمد قاسم" },
  { id: "MV-029", productId: "PRD-005", productName: "كيك شوكولاتة",   type: "receive",   quantityIn: 25,  quantityOut: 0,  stockAfter: 88,  reference: "PO-2411", reason: "استلام من المورد",    date: daysAgo(23), createdBy: "طارق منصور" },
  { id: "MV-030", productId: "PRD-006", productName: "كنافة بالجبن",   type: "receive",   quantityIn: 35,  quantityOut: 0,  stockAfter: 57,  reference: "PO-2412", reason: "استلام من المورد",    date: daysAgo(22), createdBy: "سارة حداد" },
  { id: "MV-031", productId: "PRD-003", productName: "عصير برتقال 1L", type: "issue",     quantityIn: 0,   quantityOut: 30, stockAfter: 200, reference: "INV-1016", reason: "بيع",               date: daysAgo(21), createdBy: "لينا بركات" },
  { id: "MV-032", productId: "PRD-002", productName: "شاي أخضر 100g",  type: "issue",     quantityIn: 0,   quantityOut: 30, stockAfter: 185, reference: "INV-1017", reason: "بيع",               date: daysAgo(20), createdBy: "أحمد قاسم" },
  { id: "MV-033", productId: "PRD-007", productName: "معمول تمر",      type: "receive",   quantityIn: 40,  quantityOut: 0,  stockAfter: 65,  reference: "PO-2413", reason: "استلام من المورد",    date: daysAgo(19), createdBy: "طارق منصور" },
  { id: "MV-034", productId: "PRD-008", productName: "زيت زيتون 750ml",type: "issue",     quantityIn: 0,   quantityOut: 10, stockAfter: 28,  reference: "INV-1018", reason: "بيع",               date: daysAgo(18), createdBy: "سارة حداد" },
  { id: "MV-035", productId: "PRD-001", productName: "قهوة عربية 250g", type: "receive",  quantityIn: 40,  quantityOut: 0,  stockAfter: 147, reference: "PO-2414", reason: "استلام من المورد",    date: daysAgo(17), createdBy: "لينا بركات" },
  // Damage batch
  { id: "MV-036", productId: "PRD-006", productName: "كنافة بالجبن",   type: "damage",    quantityIn: 0,   quantityOut: 7,  stockAfter: 50,  reference: "DMG-002",  reason: "تلف - تعرض للرطوبة", date: daysAgo(16), createdBy: "أحمد قاسم" },
  { id: "MV-037", productId: "PRD-005", productName: "كيك شوكولاتة",   type: "issue",     quantityIn: 0,   quantityOut: 15, stockAfter: 73,  reference: "INV-1019", reason: "بيع",               date: daysAgo(15), createdBy: "طارق منصور" },
  { id: "MV-038", productId: "PRD-004", productName: "مياه معدنية 500ml", type: "issue",  quantityIn: 0,   quantityOut: 60, stockAfter: 320, reference: "INV-1020", reason: "بيع",               date: daysAgo(14), createdBy: "سارة حداد" },
  { id: "MV-039", productId: "PRD-003", productName: "عصير برتقال 1L", type: "receive",   quantityIn: 100, quantityOut: 0,  stockAfter: 300, reference: "PO-2415", reason: "استلام من المورد",    date: daysAgo(13), createdBy: "أحمد قاسم" },
  { id: "MV-040", productId: "PRD-002", productName: "شاي أخضر 100g",  type: "issue",     quantityIn: 0,   quantityOut: 20, stockAfter: 165, reference: "INV-1021", reason: "بيع",               date: daysAgo(12), createdBy: "لينا بركات" },
  { id: "MV-041", productId: "PRD-007", productName: "معمول تمر",      type: "issue",     quantityIn: 0,   quantityOut: 18, stockAfter: 47,  reference: "INV-1022", reason: "بيع",               date: daysAgo(11), createdBy: "طارق منصور" },
  { id: "MV-042", productId: "PRD-008", productName: "زيت زيتون 750ml",type: "receive",   quantityIn: 30,  quantityOut: 0,  stockAfter: 58,  reference: "PO-2416", reason: "استلام من المورد",    date: daysAgo(10), createdBy: "سارة حداد" },
  { id: "MV-043", productId: "PRD-001", productName: "قهوة عربية 250g", type: "issue",    quantityIn: 0,   quantityOut: 20, stockAfter: 127, reference: "INV-1023", reason: "بيع",               date: daysAgo(9),  createdBy: "أحمد قاسم" },
  { id: "MV-044", productId: "PRD-005", productName: "كيك شوكولاتة",   type: "receive",   quantityIn: 20,  quantityOut: 0,  stockAfter: 93,  reference: "PO-2417", reason: "استلام من المورد",    date: daysAgo(8),  createdBy: "لينا بركات" },
  { id: "MV-045", productId: "PRD-004", productName: "مياه معدنية 500ml",type:"adjustment",quantityIn: 0,   quantityOut: 8,  stockAfter: 312, reference: "ADJ-003",  reason: "تسوية - كسر بضاعة",  date: daysAgo(7),  createdBy: "طارق منصور" },
  { id: "MV-046", productId: "PRD-003", productName: "عصير برتقال 1L", type: "issue",     quantityIn: 0,   quantityOut: 45, stockAfter: 255, reference: "INV-1024", reason: "بيع",               date: daysAgo(6),  createdBy: "سارة حداد" },
  { id: "MV-047", productId: "PRD-006", productName: "كنافة بالجبن",   type: "issue",     quantityIn: 0,   quantityOut: 12, stockAfter: 38,  reference: "INV-1025", reason: "بيع",               date: daysAgo(5),  createdBy: "أحمد قاسم" },
  { id: "MV-048", productId: "PRD-002", productName: "شاي أخضر 100g",  type: "receive",   quantityIn: 50,  quantityOut: 0,  stockAfter: 215, reference: "PO-2418", reason: "استلام من المورد",    date: daysAgo(4),  createdBy: "طارق منصور" },
  { id: "MV-049", productId: "PRD-008", productName: "زيت زيتون 750ml",type: "issue",     quantityIn: 0,   quantityOut: 15, stockAfter: 43,  reference: "INV-1026", reason: "بيع",               date: daysAgo(3),  createdBy: "لينا بركات" },
  { id: "MV-050", productId: "PRD-001", productName: "قهوة عربية 250g", type: "damage",   quantityIn: 0,   quantityOut: 3,  stockAfter: 124, reference: "DMG-003",  reason: "تلف - سقوط وكسر",    date: daysAgo(2),  createdBy: "سارة حداد" },
  { id: "MV-051", productId: "PRD-007", productName: "معمول تمر",      type: "receive",   quantityIn: 50,  quantityOut: 0,  stockAfter: 97,  reference: "PO-2419", reason: "استلام من المورد",    date: daysAgo(2),  createdBy: "أحمد قاسم" },
  { id: "MV-052", productId: "PRD-005", productName: "كيك شوكولاتة",   type: "issue",     quantityIn: 0,   quantityOut: 8,  stockAfter: 85,  reference: "INV-1027", reason: "بيع",               date: daysAgo(1),  createdBy: "طارق منصور" },
  { id: "MV-053", productId: "PRD-004", productName: "مياه معدنية 500ml", type: "receive",quantityIn: 150, quantityOut: 0,  stockAfter: 462, reference: "PO-2420", reason: "استلام من المورد",    date: daysAgo(1),  createdBy: "سارة حداد" },
  { id: "MV-054", productId: "PRD-003", productName: "عصير برتقال 1L", type: "issue",     quantityIn: 0,   quantityOut: 25, stockAfter: 230, reference: "INV-1028", reason: "بيع",               date: daysAgo(0),  createdBy: "أحمد قاسم" },
  { id: "MV-055", productId: "PRD-006", productName: "كنافة بالجبن",   type: "receive",   quantityIn: 40,  quantityOut: 0,  stockAfter: 78,  reference: "PO-2421", reason: "استلام من المورد",    date: daysAgo(0),  createdBy: "لينا بركات" },
];
