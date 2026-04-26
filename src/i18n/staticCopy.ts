import type { AppLanguage } from "./translations";

type LocalizedAttribute = "placeholder" | "aria-label" | "title" | "alt";

const LOCALIZED_ATTRIBUTES: LocalizedAttribute[] = [
  "placeholder",
  "aria-label",
  "title",
  "alt",
];

const originalTextNodes = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Partial<Record<LocalizedAttribute, string>>>();

const arCopy: Record<string, string> = {
  "Customer workspace": "مساحة العملاء",
  Customers: "العملاء",
  "Manage customer profiles, debtors, recent activity, and connected financial records from one CRM-style workspace.":
    "أدر ملفات العملاء والمدينين والنشاطات الأخيرة والسجلات المالية المرتبطة من مساحة عمل واحدة.",
  "Add Customer": "إضافة عميل",
  Export: "تصدير",
  "Total Customers": "إجمالي العملاء",
  "Active Customers": "العملاء النشطون",
  Debtors: "المدينون",
  "New This Month": "جدد هذا الشهر",
  "Outstanding Balance": "الرصيد المستحق",
  "Updated today": "تم التحديث اليوم",
  "Currently trading accounts": "حسابات نشطة حالياً",
  "Require balance follow-up": "تحتاج متابعة الرصيد",
  "Fresh accounts added": "حسابات جديدة مضافة",
  "Search by customer name, code, phone, email, or note":
    "ابحث باسم العميل أو الرمز أو الهاتف أو البريد أو الملاحظة",
  Filters: "الفلاتر",
  "More Filters": "فلاتر إضافية",
  Status: "الحالة",
  "All statuses": "كل الحالات",
  "All Statuses": "كل الحالات",
  Active: "نشط",
  Debtor: "مدين",
  VIP: "مميز",
  New: "جديد",
  Inactive: "غير نشط",
  Blocked: "محظور",
  Location: "الموقع",
  "All locations": "كل المواقع",
  "Balance State": "حالة الرصيد",
  "All balances": "كل الأرصدة",
  "Debtors only": "المدينون فقط",
  "Clear balance": "رصيد صاف",
  "High balance": "رصيد مرتفع",
  "Joined Date": "تاريخ الانضمام",
  "All time": "كل الفترات",
  "Last 30 days": "آخر 30 يوماً",
  "Last 90 days": "آخر 90 يوماً",
  "Last 12 months": "آخر 12 شهراً",
  "Customer Type": "نوع العميل",
  "Any type": "أي نوع",
  Tags: "الوسوم",
  "Any tag": "أي وسم",
  "Credit Status": "حالة الائتمان",
  "Any status": "أي حالة",
  "Near credit limit": "قريب من حد الائتمان",
  "Over credit limit": "تجاوز حد الائتمان",
  "Last Order Date": "تاريخ آخر طلب",
  "Last Payment Date": "تاريخ آخر دفعة",
  Any: "أي",
  "No orders": "لا توجد طلبات",
  "No payments": "لا توجد دفعات",
  Clear: "مسح",
  "Clear filters": "مسح الفلاتر",
  "Customer operations": "عمليات العملاء",
  Customer: "العميل",
  Contact: "التواصل",
  Balance: "الرصيد",
  "Last Activity": "آخر نشاط",
  Actions: "الإجراءات",
  "No matching customers found": "لا توجد عملاء مطابقون",
  "Adjust filters or add a new customer.": "عدّل الفلاتر أو أضف عميلاً جديداً.",
  "Unable to load customers": "تعذر تحميل العملاء",
  Open: "فتح",
  "More actions": "إجراءات إضافية",
  selected: "محدد",
  "Export selected": "تصدير المحدد",
  "Tag selected": "وسم المحدد",
  "Mark as VIP": "تعيين كمميز",
  Archive: "أرشفة",
  Delete: "حذف",
  Payments: "الدفعات",
  "Payments workspace": "مساحة الدفعات",
  "Manage collections, trace invoice-linked payments, and act on exceptions from one finance workspace.":
    "أدر التحصيلات وتتبع الدفعات المرتبطة بالفواتير وتعامل مع الاستثناءات من مساحة مالية واحدة.",
  "New payment": "دفعة جديدة",
  "Total payments": "إجمالي الدفعات",
  "Collected today": "محصل اليوم",
  "Pending payments": "دفعات معلقة",
  "Refunded payments": "دفعات مستردة",
  "Failed payments": "دفعات فاشلة",
  "This month": "هذا الشهر",
  "Search by payment ID, invoice number, customer, amount, method, or reference":
    "ابحث برقم الدفعة أو الفاتورة أو العميل أو المبلغ أو الطريقة أو المرجع",
  Method: "الطريقة",
  "All methods": "كل الطرق",
  "Date range": "نطاق التاريخ",
  "All dates": "كل التواريخ",
  Today: "اليوم",
  "This week": "هذا الأسبوع",
  Amount: "المبلغ",
  "All amounts": "كل المبالغ",
  "Under $500": "أقل من 500 دولار",
  "$500 to $2,000": "من 500 إلى 2,000 دولار",
  "$2,000+": "2,000 دولار فأكثر",
  Invoice: "الفاتورة",
  "All invoices": "كل الفواتير",
  "Link state": "حالة الربط",
  "All records": "كل السجلات",
  "Linked only": "المرتبطة فقط",
  "Unlinked only": "غير المرتبطة فقط",
  "Created by": "أنشأه",
  "Any user": "أي مستخدم",
  Completed: "مكتملة",
  Pending: "معلقة",
  Failed: "فاشلة",
  Refunded: "مستردة",
  Partial: "جزئية",
  "Review now": "راجع الآن",
  "Payment operations": "عمليات الدفعات",
  "Payment ID": "رقم الدفعة",
  "Payment Date": "تاريخ الدفعة",
  Reference: "المرجع",
  "No matching payments found": "لا توجد دفعات مطابقة",
  "Adjust your filters or record a new payment.": "عدّل الفلاتر أو سجّل دفعة جديدة.",
  "Unable to load payments": "تعذر تحميل الدفعات",
  Products: "المنتجات",
  "Product Operations": "عمليات المنتجات",
  "Manage inventory, pricing, product maintenance, and purchase or sales visibility from one workspace.":
    "أدر المخزون والتسعير وصيانة المنتجات ورؤية الشراء والبيع من مساحة واحدة.",
  "Add Product": "إضافة منتج",
  "Search by name, code, category, barcode, or description":
    "ابحث بالاسم أو الرمز أو التصنيف أو الباركود أو الوصف",
  Category: "التصنيف",
  "All categories": "كل التصنيفات",
  "Stock Status": "حالة المخزون",
  "In Stock": "متوفر",
  "Low Stock": "مخزون منخفض",
  "Reorder Soon": "إعادة طلب قريباً",
  "Out of Stock": "نافد",
  Supplier: "المورد",
  "All suppliers": "كل الموردين",
  "All Suppliers": "كل الموردين",
  "Sort By": "ترتيب حسب",
  Newest: "الأحدث",
  Name: "الاسم",
  "Sale Price": "سعر البيع",
  "Purchase Price": "سعر الشراء",
  Profit: "الربح",
  Margin: "الهامش",
  Stock: "المخزون",
  Archived: "الأرشفة",
  "Active only": "النشط فقط",
  "Archived only": "المؤرشف فقط",
  Order: "الترتيب",
  Descending: "تنازلي",
  Ascending: "تصاعدي",
  "Product Cards": "بطاقات المنتجات",
  "Product List": "قائمة المنتجات",
  Product: "المنتج",
  "Code / SKU": "الرمز / SKU",
  "No matching products found.": "لا توجد منتجات مطابقة.",
  "Try adjusting filters, or add a new product to start managing inventory.":
    "جرّب تعديل الفلاتر أو أضف منتجاً جديداً لبدء إدارة المخزون.",
  Purchases: "المشتريات",
  "New Purchase": "شراء جديد",
  Import: "استيراد",
  "Total Purchases": "إجمالي المشتريات",
  "Pending Orders": "طلبات معلقة",
  "Received Today": "تم الاستلام اليوم",
  "Overdue Bills": "فواتير متأخرة",
  "Search by PO number, supplier, status or product...":
    "ابحث برقم أمر الشراء أو المورد أو الحالة أو المنتج...",
  "Order Date": "تاريخ الطلب",
  "Delivery Date": "تاريخ التسليم",
  "Payment Status": "حالة الدفع",
  "Any Range": "أي نطاق",
  "This Month": "هذا الشهر",
  "Last 7 Days": "آخر 7 أيام",
  "This Week": "هذا الأسبوع",
  Paid: "مدفوعة",
  Unpaid: "غير مدفوعة",
  Draft: "مسودة",
  "Partially Received": "مستلمة جزئياً",
  Received: "مستلمة",
  Cancelled: "ملغاة",
  "PO Number": "رقم أمر الشراء",
  "Total Amount": "المبلغ الإجمالي",
  Suppliers: "الموردون",
  "Total Suppliers": "إجمالي الموردين",
  "Active Suppliers": "الموردون النشطون",
  "Outstanding Payables": "مستحقات قائمة",
  "Top Rated Suppliers": "أفضل الموردين تقييماً",
  "Search by supplier name, code, phone, email, product, or note":
    "ابحث باسم المورد أو الرمز أو الهاتف أو البريد أو المنتج أو الملاحظة",
  "Payment Terms": "شروط الدفع",
  Currency: "العملة",
  Rating: "التقييم",
  Country: "الدولة",
  City: "المدينة",
  "Tax Registered": "مسجل ضريبياً",
  Preferred: "مفضل",
  "New Suppliers": "موردون جدد",
  Treasury: "الخزينة",
  "Incoming Customer Cheques": "شيكات العملاء الواردة",
  "Outgoing Supplier Cheques": "شيكات الموردين الصادرة",
  Cheque: "الشيك",
  "Due Date": "تاريخ الاستحقاق",
  OCR: "التعرف الضوئي",
  Journal: "القيد",
  Approve: "اعتماد",
  "No OCR": "لا يوجد OCR",
  "Invoice Management": "إدارة الفواتير",
  "Customer, internal, and supplier invoices.": "فواتير العملاء والداخلية والموردين.",
  "New Invoice": "فاتورة جديدة",
  Client: "العميل",
  Items: "البنود",
  "Category / Priority": "التصنيف / الأولوية",
  "Terms / Code": "الشروط / الرمز",
  Total: "الإجمالي",
  Remaining: "المتبقي",
  "Approval / Status": "الاعتماد / الحالة",
  Overdue: "متأخرة",
  "High Priority": "أولوية عالية",
  "General Ledger": "الأستاذ العام",
  Reports: "التقارير",
  Settings: "الإعدادات",
  "Rows per page": "الصفوف في الصفحة",
  Previous: "السابق",
  Next: "التالي",
  "Single page": "صفحة واحدة",
  Save: "حفظ",
  "Save Changes": "حفظ التعديلات",
  Cancel: "إلغاء",
  Close: "إغلاق",
  Edit: "تعديل",
  "Confirm Delete": "تأكيد الحذف",
  "No data found.": "لا توجد بيانات.",
  Loading: "جارٍ التحميل",
  "Loading...": "جارٍ التحميل...",
};

const dynamicRules: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Showing ([0-9,-]+) of ([0-9,]+)$/i, (match) => `عرض ${match[1]} من ${match[2]}`],
  [/^Showing ([0-9,]+) (customer|customers|payment|payments|invoice|invoices|record|records) in the current view$/i, (match) => `يعرض ${match[1]} سجل ضمن العرض الحالي`],
  [/^([0-9,]+) (result|results)$/i, (match) => `${match[1]} نتيجة`],
  [/^([0-9,]+) (records|record) in this view$/i, (match) => `${match[1]} سجل في هذا العرض`],
  [/^([0-9,]+) selected$/i, (match) => `${match[1]} محدد`],
  [/^Open actions for (.+)$/i, (match) => `فتح إجراءات ${match[1]}`],
  [/^Select (.+)$/i, (match) => `تحديد ${match[1]}`],
  [/^Select all visible (.+)$/i, (match) => `تحديد كل ${match[1]} الظاهرة`],
];

function translateText(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();

  if (!core) return value;

  const exact = arCopy[core];
  if (exact) return `${leading}${exact}${trailing}`;

  const normalized = core.replace(/\s+/g, " ");
  const normalizedExact = arCopy[normalized];
  if (normalizedExact) return `${leading}${normalizedExact}${trailing}`;

  for (const [rule, replacer] of dynamicRules) {
    const match = normalized.match(rule);
    if (match) return `${leading}${replacer(match)}${trailing}`;
  }

  return value;
}

function shouldSkipElement(element: Element) {
  return ["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "SVG", "PATH"].includes(element.tagName);
}

function translateElementAttributes(element: Element, language: AppLanguage) {
  if (language === "ar") {
    const stored = originalAttributes.get(element) ?? {};

    for (const attribute of LOCALIZED_ATTRIBUTES) {
      const current = element.getAttribute(attribute);
      if (!current) continue;

      if (!stored[attribute]) {
        stored[attribute] = current;
      }

      const translated = translateText(stored[attribute] ?? current);
      if (translated !== current) {
        element.setAttribute(attribute, translated);
      }
    }

    originalAttributes.set(element, stored);
    return;
  }

  const stored = originalAttributes.get(element);
  if (!stored) return;

  for (const attribute of LOCALIZED_ATTRIBUTES) {
    if (stored[attribute]) {
      element.setAttribute(attribute, stored[attribute]);
    }
  }
}

function translateTree(root: Node, language: AppLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.currentNode;

  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (shouldSkipElement(element)) {
        node = walker.nextSibling();
        continue;
      }
      translateElementAttributes(element, language);
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      if (!originalTextNodes.has(textNode)) {
        originalTextNodes.set(textNode, textNode.nodeValue ?? "");
      }

      const original = originalTextNodes.get(textNode) ?? "";
      textNode.nodeValue = language === "ar" ? translateText(original) : original;
    }

    node = walker.nextNode();
  }
}

export function localizeDocument(language: AppLanguage) {
  if (typeof document === "undefined") {
    return () => undefined;
  }

  const applyLocalization = () => translateTree(document.body, language);
  applyLocalization();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
          translateTree(node, language);
        }
      });

      if (mutation.type === "characterData" && mutation.target.nodeType === Node.TEXT_NODE) {
        const textNode = mutation.target as Text;
        if (language === "ar") {
          const current = textNode.nodeValue ?? "";
          const stored = originalTextNodes.get(textNode);
          if (!stored || translateText(stored) !== current) {
            originalTextNodes.set(textNode, current);
            textNode.nodeValue = translateText(current);
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return () => observer.disconnect();
}
