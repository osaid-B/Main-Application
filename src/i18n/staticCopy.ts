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

// ═══════════════════════════════════════════════════════════════
//  COMPREHENSIVE ARABIC TRANSLATIONS — Palestinian / Levantine dialect
// ═══════════════════════════════════════════════════════════════
const arCopy: Record<string, string> = {

  // ── COMMON UI ───────────────────────────────────────────────
  "Save": "حفظ",
  "Save Changes": "حفظ التعديلات",
  "Cancel": "إلغاء",
  "Close": "إغلاق",
  "Edit": "تعديل",
  "Delete": "حذف",
  "Add": "إضافة",
  "Back": "رجوع",
  "Continue": "كمّل",
  "Search": "بحث",
  "Actions": "إجراءات",
  "Status": "الحالة",
  "Filters": "فلاتر",
  "Filter": "فلتر",
  "Apply": "طبّق",
  "Reset": "إعادة ضبط",
  "Clear": "مسح",
  "Clear filters": "مسح الفلاتر",
  "Export": "تصدير",
  "Import": "استيراد",
  "Loading": "جارٍ التحميل",
  "Loading...": "جارٍ التحميل...",
  "No data found.": "ما في بيانات.",
  "Confirm Delete": "تأكيد الحذف",
  "Confirm Update": "تأكيد التعديل",
  "Open": "فتح",
  "More actions": "إجراءات إضافية",
  "Archive": "أرشفة",
  "View": "عرض",
  "Preview": "معاينة",
  "Download": "تحميل",
  "Upload": "رفع",
  "Submit": "إرسال",
  "Approve": "اعتماد",
  "Reject": "رفض",
  "Restore": "استعادة",
  "Duplicate": "نسخ",
  "Print": "طباعة",
  "Select": "اختار",
  "Select All": "اختار الكل",
  "Deselect All": "إلغاء الكل",
  "selected": "محدد",
  "Export selected": "تصدير المحدد",
  "Tag selected": "وسم المحدد",
  "Mark as VIP": "عيّنه كمميز",
  "More Filters": "فلاتر إضافية",
  "Previous": "السابق",
  "Next": "التالي",
  "Single page": "صفحة واحدة",
  "Rows per page": "الصفوف بالصفحة",
  "Review now": "راجع هلق",
  "Today": "اليوم",
  "This week": "هالأسبوع",
  "This Month": "هالشهر",
  "This month": "هالشهر",
  "Last 7 Days": "آخر 7 أيام",
  "Last 30 days": "آخر 30 يوم",
  "Last 90 days": "آخر 90 يوم",
  "Last 12 months": "آخر 12 شهر",
  "All time": "كل الفترات",
  "Any": "أي",
  "Any type": "أي نوع",
  "Any tag": "أي وسم",
  "Any status": "أي حالة",
  "Date range": "نطاق التاريخ",
  "All dates": "كل التواريخ",
  "All statuses": "كل الحالات",
  "All Statuses": "كل الحالات",
  "All records": "كل السجلات",
  "All invoices": "كل الفواتير",
  "All amounts": "كل المبالغ",
  "All methods": "كل الطرق",
  "Any Range": "أي نطاق",
  "Created by": "أضافه",
  "Any user": "أي مستخدم",
  "Linked only": "المرتبطة بس",
  "Unlinked only": "غير المرتبطة بس",
  "Link state": "حالة الربط",

  // ── STATUS LABELS ────────────────────────────────────────────
  "Active": "نشط",
  "Inactive": "غير نشط",
  "Pending": "معلقة",
  "Completed": "مكتملة",
  "Failed": "فاشلة",
  "Refunded": "مستردة",
  "Partial": "جزئية",
  "Paid": "مدفوعة",
  "Unpaid": "مش مدفوعة",
  "Overdue": "متأخرة",
  "Draft": "مسودة",
  "Received": "مستلمة",
  "Partially Received": "مستلمة جزئياً",
  "Cancelled": "ملغاة",
  "High Priority": "أولوية عالية",
  "Archived": "مؤرشف",
  "New": "جديد",
  "Debtor": "مدين",
  "VIP": "مميز",
  "Blocked": "محظور",
  "Approved": "معتمد",
  "Rejected": "مرفوض",
  "In Progress": "جارٍ",
  "On Hold": "متوقف",
  "Present": "حاضر",
  "Absent": "غايب",
  "Late": "متأخر",
  "Half Day": "نص يوم",
  "Leave": "إجازة",

  // ── NAVIGATION / LAYOUT ─────────────────────────────────────
  "Dashboard": "الرئيسية",
  "Customers": "الزباين",
  "Products": "المنتجات",
  "Purchases": "المشتريات",
  "Suppliers": "الموردين",
  "Invoices": "الفواتير",
  "Payments": "الدفعات",
  "Treasury": "الخزينة",
  "Employees": "الموظفين",
  "Settings": "الإعدادات",
  "General Ledger": "الأستاذ العام",
  "Reports": "التقارير",
  "Data Import": "استيراد البيانات",

  // ── FIELD LABELS ─────────────────────────────────────────────
  "Name": "الاسم",
  "Phone": "الهاتف",
  "Email": "الإيميل",
  "Address": "العنوان",
  "City": "المدينة",
  "Country": "الدولة",
  "Location": "الموقع",
  "Amount": "المبلغ",
  "Total": "الإجمالي",
  "Balance": "الرصيد",
  "Date": "التاريخ",
  "Due Date": "تاريخ الاستحقاق",
  "Order Date": "تاريخ الطلب",
  "Delivery Date": "تاريخ التسليم",
  "Payment Date": "تاريخ الدفعة",
  "Notes": "ملاحظات",
  "Description": "وصف",
  "Reference": "المرجع",
  "Code": "الكود",
  "Category": "التصنيف",
  "Tags": "الوسوم",
  "Method": "الطريقة",
  "Currency": "العملة",
  "Tax": "الضريبة",
  "Discount": "خصم",
  "Quantity": "الكمية",
  "Price": "السعر",
  "Sale Price": "سعر البيع",
  "Purchase Price": "سعر الشراء",
  "Margin": "الهامش",
  "Profit": "الربح",
  "Stock": "المخزن",
  "Rating": "التقييم",
  "Payment Terms": "شروط الدفع",
  "Tax Registered": "مسجّل ضريبياً",
  "Preferred": "مفضّل",
  "Contact": "التواصل",
  "Customer": "الزبون",
  "Client": "الزبون",
  "Supplier": "المورد",
  "Invoice": "الفاتورة",
  "Product": "المنتج",
  "Department": "القسم",
  "Position": "الوظيفة",
  "Salary": "الراتب",
  "Hours": "ساعات",
  "Items": "البنود",

  // ── CUSTOMERS PAGE ───────────────────────────────────────────
  "Customer workspace": "مساحة الزباين",
  "Manage customer profiles, debtors, recent activity, and connected financial records from one CRM-style workspace.":
    "أدر ملفات الزباين والمدينين والنشاطات الأخيرة والسجلات المالية المرتبطة من مكان واحد.",
  "Add Customer": "أضف زبون",
  "Total Customers": "مجموع الزباين",
  "Active Customers": "الزباين النشطين",
  "Debtors": "المدينين",
  "New This Month": "جدد هالشهر",
  "Outstanding Balance": "الرصيد المستحق",
  "Updated today": "تم التحديث اليوم",
  "Currently trading accounts": "حسابات نشطة",
  "Require balance follow-up": "تحتاج متابعة رصيد",
  "Fresh accounts added": "حسابات جديدة",
  "Search by customer name, code, phone, email, or note":
    "ابحث باسم الزبون أو الكود أو الهاتف أو الإيميل أو الملاحظة",
  "All locations": "كل المواقع",
  "Balance State": "حالة الرصيد",
  "All balances": "كل الأرصدة",
  "Debtors only": "المدينين بس",
  "Clear balance": "رصيد صافي",
  "High balance": "رصيد مرتفع",
  "Joined Date": "تاريخ الانضمام",
  "Customer Type": "نوع الزبون",
  "Credit Status": "حالة الائتمان",
  "Near credit limit": "قريب من حد الائتمان",
  "Over credit limit": "تجاوز حد الائتمان",
  "Last Order Date": "تاريخ آخر طلب",
  "Last Payment Date": "تاريخ آخر دفعة",
  "No orders": "ما في طلبات",
  "No payments": "ما في دفعات",
  "Customer operations": "عمليات الزباين",
  "Last Activity": "آخر نشاط",
  "No matching customers found": "ما لقينا زباين مطابقين",
  "Adjust filters or add a new customer.": "عدّل الفلاتر أو أضف زبون جديد.",
  "Unable to load customers": "ما قدرنا نحمّل الزباين",
  "Sort By": "رتّب حسب",
  "Newest": "الأحدث",
  "Descending": "تنازلي",
  "Ascending": "تصاعدي",
  "Order": "الترتيب",

  // ── PAYMENTS PAGE ────────────────────────────────────────────
  "Record Payment": "سجّل دفعة",
  "Edit Payment": "تعديل الدفعة",
  "Payment setup": "إعداد الدفعة",
  "Choose the invoice, payment status, and collection method.": "اختار الفاتورة وحالة الدفع وطريقة التحصيل.",
  "Reference and note": "المرجع والملاحظة",
  "Keep receipt references and collection context easy to audit.": "احفظ مراجع الإيصال وسياق التحصيل بشكل سهل.",
  "Select invoice": "اختار الفاتورة",
  "Payment date": "تاريخ الدفعة",
  "Invoice impact": "أثر الفاتورة",
  "No invoice selected": "ما في فاتورة محددة",
  "Operational checks": "فحوصات تشغيلية",
  "Save payment": "احفظ الدفعة",
  "Save changes": "احفظ التعديلات",
  "Capture invoice-linked receipts with clearer financial impact before saving.":
    "التقط إيصالات مرتبطة بالفاتورة مع الأثر المالي قبل الحفظ.",
  "Payments workspace": "مساحة الدفعات",
  "Manage collections, trace invoice-linked payments, and act on exceptions from one finance workspace.":
    "أدر التحصيلات وتتبع الدفعات المرتبطة بالفواتير وعالج الاستثناءات من مكان واحد.",
  "New payment": "دفعة جديدة",
  "Total payments": "مجموع الدفعات",
  "Collected today": "محصّل اليوم",
  "Pending payments": "دفعات معلقة",
  "Refunded payments": "دفعات مستردة",
  "Failed payments": "دفعات فاشلة",
  "Search by payment ID, invoice number, customer, amount, method, or reference":
    "ابحث برقم الدفعة أو الفاتورة أو الزبون أو المبلغ أو الطريقة أو المرجع",
  "Under $500": "أقل من 500 دولار",
  "$500 to $2,000": "من 500 لـ 2,000 دولار",
  "$2,000+": "أكثر من 2,000 دولار",
  "Payment operations": "عمليات الدفعات",
  "Payment ID": "رقم الدفعة",
  "No matching payments found": "ما لقينا دفعات مطابقة",
  "Adjust your filters or record a new payment.": "عدّل الفلاتر أو سجّل دفعة جديدة.",
  "Unable to load payments": "ما قدرنا نحمّل الدفعات",

  // ── PRODUCTS PAGE ────────────────────────────────────────────
  "Product Operations": "عمليات المنتجات",
  "Manage inventory, pricing, product maintenance, and purchase or sales visibility from one workspace.":
    "أدر المخزن والتسعير وصيانة المنتجات ورؤية الشراء والبيع من مكان واحد.",
  "Add Product": "أضف منتج",
  "Search by name, code, category, barcode, or description":
    "ابحث بالاسم أو الكود أو التصنيف أو الباركود أو الوصف",
  "All categories": "كل التصنيفات",
  "Stock Status": "حالة المخزن",
  "In Stock": "متوفر",
  "Low Stock": "مخزن منخفض",
  "Reorder Soon": "بحتاج إعادة طلب",
  "Out of Stock": "نافد",
  "All Suppliers": "كل الموردين",
  "All suppliers": "كل الموردين",
  "Active only": "النشط بس",
  "Archived only": "المؤرشف بس",
  "Product Cards": "بطاقات المنتجات",
  "Product List": "قائمة المنتجات",
  "Code / SKU": "الكود / SKU",
  "No matching products found.": "ما لقينا منتجات مطابقة.",
  "Try adjusting filters, or add a new product to start managing inventory.":
    "جرّب تغيّر الفلاتر أو أضف منتج جديد لتبدأ إدارة المخزن.",
  "Manage Categories": "إدارة التصنيفات",
  "Add Category": "أضف تصنيف",
  "Category Name": "اسم التصنيف",
  "No categories yet.": "ما في تصنيفات لهلق.",
  "Search categories...": "ابحث في التصنيفات...",
  "Search categories…": "ابحث في التصنيفات...",
  "All Categories": "كل التصنيفات",
  "Any Stock": "أي كمية",
  "Any Supplier": "أي مورد",
  "Refine product results quickly without covering the page.": "عدّل نتائج المنتجات بسرعة بدون ما تغطي الصفحة.",
  "Rename Category": "تغيير اسم التصنيف",
  "New Category": "تصنيف جديد",
  "Category name": "اسم التصنيف",
  "Save Rename": "حفظ الاسم",
  "Cancel Edit": "إلغاء التعديل",
  "No categories yet. Add one above.": "ما في تصنيفات لهلق. أضف واحد من فوق.",
  "Clear search": "مسح البحث",
  "Delete category?": "حذف التصنيف؟",
  "No products currently use this category.": "ما في منتجات بتستخدم هالتصنيف.",
  "Confirmation Code": "كود التأكيد",
  "Type 123 to delete": "اكتب 123 للحذف",
  "Type 123 to confirm.": "اكتب 123 للتأكيد.",
  "Delete Category": "احذف التصنيف",
  "Delete category": "احذف التصنيف",
  "Product details": "تفاصيل المنتج",
  "Product Details": "تفاصيل المنتج",
  "Delete product?": "حذف المنتج؟",
  "Delete Product": "احذف المنتج",
  "Delete product": "احذف المنتج",
  "Uncategorized": "بدون تصنيف",
  "Product Code": "رمز المنتج",
  "Generated automatically and cannot be edited manually.": "بيتولّد تلقائي وما بتقدر تعدّله.",
  "Product name": "اسم المنتج",
  "Choose or type category": "اختار أو اكتب التصنيف",
  "No supplier": "بدون مورد",
  "Min Stock": "أقل مخزن",
  "Barcode": "الباركود",
  "Optional barcode": "الباركود (اختياري)",
  "Optional description": "الوصف (اختياري)",
  "Product code is generated automatically. Enter pricing, stock, category, supplier, and optional barcode details.": "رمز المنتج بيتولّد تلقائي. أضف التسعير والمخزن والتصنيف والمورد وتفاصيل الباركود.",
  "Add, rename, or delete product categories. Renaming updates all related products automatically.": "أضف أو سمّي أو احذف تصنيفات المنتجات. التسمية الجديدة راح تنطبق تلقائي على كل المنتجات.",
  "Reset": "إعادة تعيين",
  "Apply": "تطبيق",

  // ── PURCHASES PAGE ───────────────────────────────────────────
  "New Purchase": "طلبية شراء جديدة",
  "Search by PO number, supplier, status or product...":
    "ابحث برقم الطلبية أو المورد أو الحالة أو المنتج...",
  "PO Number": "رقم الطلبية",
  "Total Amount": "المبلغ الإجمالي",
  "Total Purchases": "مجموع المشتريات",
  "Pending Orders": "طلبيات معلقة",
  "Received Today": "مستلمة اليوم",
  "Overdue Bills": "فواتير متأخرة",
  "Payment Status": "حالة الدفع",
  "This Week": "هالأسبوع",
  "New Supplier": "مورد جديد",
  "Create New Supplier": "أنشئ مورد جديد",
  "Select Supplier": "اختار المورد",
  "Select Product": "اختار المنتج",
  "Unit Price": "سعر الوحدة",
  "Total Cost": "الكلفة الإجمالية",
  "Tax Rate": "نسبة الضريبة",
  "Warehouse": "المستودع",
  "Add New Purchase": "طلبية شراء جديدة",
  "Edit Purchase": "تعديل الطلبية",
  "Save as Draft": "حفظ كمسودة",
  "Mark as Received": "علّمها كمستلمة",
  "Approve Purchase": "اعتمد الطلبية",
  "Cancel Purchase": "إلغاء الطلبية",
  "Record Payment": "سجّل دفعة",
  "View Details": "عرض التفاصيل",
  "Return Items": "إرجاع البضاعة",

  // ── SUPPLIERS PAGE ───────────────────────────────────────────
  "Total Suppliers": "مجموع الموردين",
  "Active Suppliers": "الموردين النشطين",
  "Outstanding Payables": "مستحقات قائمة",
  "Top Rated Suppliers": "أفضل الموردين",
  "New Suppliers": "موردين جدد",
  "Search by supplier name, code, phone, email, product, or note":
    "ابحث باسم المورد أو الكود أو الهاتف أو الإيميل أو المنتج أو الملاحظة",
  "Add Supplier": "أضف مورد",
  "Edit Supplier": "تعديل المورد",
  "Supplier Details": "تفاصيل المورد",
  "Purchase History": "تاريخ المشتريات",
  "No matching suppliers found": "ما لقينا موردين مطابقين",
  "Adjust filters or add a new supplier.": "عدّل الفلاتر أو أضف مورد جديد.",
  "Manage supplier profiles, purchase history, payment terms, and vendor performance":
    "أدر ملفات الموردين وتاريخ المشتريات وشروط الدفع وأداء الموردين",
  "Keep the list focused with essential supplier fields.": "خلّي القائمة مركّزة بالحقول الأساسية.",
  "All statuses": "كل الحالات",
  "All balances": "كل الأرصدة",
  "Outstanding only": "المديونة بس",
  "High balance": "رصيد عالي",
  "Location": "الموقع",
  "No phone": "ما في هاتف",
  "No location": "ما في موقع",
  "This month": "هالشهر",
  "Updated today": "محدّث اليوم",
  "Across all vendors": "عبر كل الموردين",
  "4.6 and above": "4.6 وأكثر",

  // ── INVOICES PAGE ────────────────────────────────────────────
  "Invoice Management": "إدارة الفواتير",
  "Customer, internal, and supplier invoices.": "فواتير الزباين والداخلية والموردين.",
  "New Invoice": "فاتورة جديدة",
  "Category / Priority": "التصنيف / الأولوية",
  "Terms / Code": "الشروط / الكود",
  "Remaining": "الباقي",
  "Approval / Status": "الاعتماد / الحالة",
  "Invoice #": "رقم الفاتورة",
  "Invoice Date": "تاريخ الفاتورة",
  "Issue Date": "تاريخ الإصدار",
  "Subtotal": "المجموع قبل الضريبة",
  "Tax Amount": "مبلغ الضريبة",
  "Grand Total": "الإجمالي الكلي",
  "Amount Paid": "المدفوع",
  "Amount Due": "المستحق",
  "Search invoices...": "ابحث في الفواتير...",
  "Search invoice, name, product, or status": "ابحث بالفاتورة أو الاسم أو المنتج أو الحالة",
  "All types": "كل الأنواع",
  "Customer Invoice": "فاتورة زبون",
  "Supplier Invoice": "فاتورة مورد",
  "Internal Invoice": "فاتورة داخلية",
  "Customer Invoices": "فواتير الزباين",
  "Supplier Invoices": "فواتير الموردين",
  "Internal Invoices": "فواتير داخلية",
  "No matching invoices found": "ما لقينا فواتير مطابقة",
  "Create a new invoice to get started.": "اعمل فاتورة جديدة للبداية.",
  "Add Invoice": "أضف فاتورة",
  "Create Invoice": "أنشئ فاتورة",
  "Edit Invoice": "تعديل الفاتورة",
  "Delete Invoice": "احذف الفاتورة",
  "Mark Paid": "علّمها مدفوعة",
  "results": "نتيجة",
  "Filter": "فلتر",
  "All Statuses": "كل الحالات",
  "Partial": "جزئي",
  "Unpaid": "غير مدفوع",
  "All Due Dates": "كل تواريخ الاستحقاق",
  "Late": "متأخر",
  "Due Today": "مستحق اليوم",
  "Due This Week": "مستحق هالأسبوع",
  "All Methods": "كل الطرق",
  "Min Amount": "أقل مبلغ",
  "Max Amount": "أكبر مبلغ",
  "Any": "أي",
  "Sort By": "ترتيب حسب",
  "Newest Created": "الأحدث أولاً",
  "Oldest Created": "الأقدم أولاً",
  "Due Soon First": "الأقرب استحقاقاً",
  "Total: High to Low": "الإجمالي: من الأعلى",
  "Total: Low to High": "الإجمالي: من الأدنى",
  "Amount Due: High to Low": "المستحق: من الأعلى",
  "Department": "القسم",
  "Approval": "الاعتماد",
  "No product": "ما في منتج",
  "Approved": "معتمد",
  "Needs Approval": "يحتاج اعتماد",
  "Open": "مفتوح",
  "Type": "النوع",
  "Title": "العنوان",
  "Paid Amount": "المدفوع",
  "Currency": "العملة",
  "Payment Method": "طريقة الدفع",
  "To Pay": "للدفع",
  "Open Costs": "مصاريف مفتوحة",
  "Need Approval": "يحتاج اعتماد",
  "Awaiting payment.": "في انتظار الدفع.",
  "Not paid yet.": "لسا ما اتدفعت.",
  "Supplier invoice waiting for payment.": "فاتورة مورد في انتظار الدفع.",
  "Paid.": "مدفوعة.",
  "Partly settled.": "مسدّدة جزئياً.",
  "Needs approval.": "تحتاج اعتماد.",
  "General item": "بند عام",
  "Logistics Service": "خدمة لوجستية",
  "Maintenance": "صيانة",
  "Marketing Campaign": "حملة تسويقية",
  "Unnamed Customer": "زبون غير مسمّى",
  "Unnamed Supplier": "مورد غير مسمّى",
  "Unnamed Product": "منتج غير مسمّى",
  "Select supplier": "اختار المورد",
  "Select product": "اختار المنتج",
  "Search customer by name, email, or phone": "ابحث بالزبون بالاسم أو الإيميل أو الهاتف",
  "No customers found": "ما لقينا زباين",
  "No contact info": "ما في معلومات تواصل",
  "Invoicing Options": "خيارات الفوترة",
  "Discard changes?": "تجاهل التعديلات؟",
  "You have unsaved invoice data. If you close this window, your changes will be lost.":
    "عندك بيانات فاتورة غير محفوظة. إذا غلقت الشاشة راح تتضيع.",
  "Continue Editing": "كمّل التعديل",
  "Discard": "تجاهل",
  "Invoice created.": "تم إنشاء الفاتورة.",
  "Invoice updated.": "تم تعديل الفاتورة.",
  "Invoice deleted.": "تم حذف الفاتورة.",
  "Invoice marked as paid.": "الفاتورة اتعلّمت مدفوعة.",
  "Type 123 to confirm deletion.": "اكتب 123 للتأكيد.",

  // ── TREASURY PAGE ────────────────────────────────────────────
  "TREASURY OPERATIONS": "عمليات الخزينة",
  "Treasury Operations": "عمليات الخزينة",
  "Treasury, Cheques, and Transfers": "الخزينة، الشيكات، والتحويلات",
  "Manage incoming customer cheques, outgoing supplier cheques, transfer verification, OCR review, document custody, approval control, and reconciliation readiness from one treasury workspace.":
    "أدر شيكات الزباين الواردة، شيكات الموردين الصادرة، التحقق من التحويلات، مراجعة المسح الضوئي، والتسوية البنكية من مكان واحد.",
  "Active treasury role": "الدور المالي النشط",
  "Can approve instruments and verification workflows.": "يقدر يعتمد الأدوات المالية وعمليات التحقق.",
  "View-only access for sensitive treasury actions.": "صلاحية عرض فقط للعمليات الحساسة.",
  "Capture Instrument": "سجّل أداة مالية",
  "Bank balances": "الأرصدة البنكية",
  "Incoming cheques due soon": "شيكات واردة مستحقة قريباً",
  "Post-dated or maturing within 3 days": "مؤجلة أو تستحق خلال 3 أيام",
  "Bounced instruments": "أدوات مالية مرتجعة",
  "Need follow-up, reversal, or customer/supplier action": "تحتاج متابعة أو إلغاء أو إجراء من الزبون/المورد",
  "OCR queue": "طابور المسح الضوئي",
  "Overview": "نظرة عامة",
  "Incoming Cheques": "شيكات واردة",
  "Outgoing Cheques": "شيكات صادرة",
  "Operational Signals": "إشارات تشغيلية",
  "High-priority treasury items requiring attention": "بنود خزينة عالية الأولوية تحتاج انتباه",
  "bounced cheques": "شيكات مرتجعة",
  "bounced cheque": "شيك مرتجع",
  "Reverse payment allocations, notify customers/suppliers, and review journal impact.":
    "ألغِ توزيع الدفعات، أبلغ الزباين/الموردين، وراجع أثر القيد.",
  "transfers pending verification": "تحويلات في انتظار التحقق",
  "transfer pending verification": "تحويل في انتظار التحقق",
  "Verify proof, approve settlement, and prepare reconciliation linkage.":
    "تحقق من الإثبات، اعتمد التسوية، وجهّز ربط التسوية البنكية.",
  "instruments due within 3 days": "أدوات مالية تستحق خلال 3 أيام",
  "instrument due within 3 days": "أداة مالية تستحق خلال 3 أيام",
  "Prepare deposit batches, follow up on post-dated cheques, and monitor cash flow timing.":
    "جهّز دفعات الإيداع، تابع الشيكات المؤجلة، وراقب توقيت التدفق النقدي.",
  "Current, available, and pending instrument exposure": "الرصيد الحالي والمتاح والمعلّق",
  "OCR Review Queue": "طابور مراجعة المسح الضوئي",
  "Confidence scoring with manual review before final treasury action":
    "تقييم الثقة مع مراجعة يدوية قبل إجراء الخزينة النهائي",
  "Incoming Customer Cheques": "شيكات الزباين الواردة",
  "Received, deposited, under collection, cleared, bounced, and post-dated instruments":
    "مستلمة، مودعة، تحت التحصيل، مصروفة، مرتجعة، أو مؤجلة",
  "Outgoing Supplier Cheques": "شيكات الموردين الصادرة",
  "Approved, issued, delivered, cleared, bounced, or voided supplier instruments":
    "معتمدة، صادرة، مسلّمة، مصروفة، مرتجعة، أو ملغية",
  "Incoming and outgoing transfers with proof review, OCR, and settlement verification":
    "تحويلات واردة وصادرة مع مراجعة الإثبات والتحقق",
  "Counterparty": "الطرف المقابل",
  "Proof / OCR": "الإثبات / المسح",
  "Incoming transfer": "تحويل وارد",
  "Outgoing transfer": "تحويل صادر",
  "Settlement pending": "التسوية معلّقة",
  "Verify": "تحقّق",
  "Reconciliation Readiness": "جاهزية التسوية",
  "Suggested, unmatched, and partially matched treasury records waiting for bank statement linkage":
    "سجلات خزينة مقترحة وغير مطابقة وجزئية في انتظار الربط مع كشف البنك",
  "Run Suggestions": "شغّل الاقتراحات",
  "Source": "المصدر",
  "Match Status": "حالة التطابق",
  "Suggested Match": "تطابق مقترح",
  "Instrument Controls": "ضوابط الأدوات المالية",
  "Sensitive treasury actions are role-gated and audited": "العمليات الحساسة محمية بالصلاحيات ومراجَعة",
  "Approve cheques": "اعتماد الشيكات",
  "Allowed": "مسموح",
  "Restricted": "محدود",
  "Verify transfers": "التحقق من التحويلات",
  "Correct OCR": "تصحيح المسح الضوئي",
  "Reconciliation actions": "إجراءات التسوية",
  "Audit Trail": "سجل المراجعة",
  "OCR corrections, approvals, deposits, and verification history":
    "تصحيحات المسح والاعتمادات والإيداعات وسجل التحقق",
  "Transfer details": "تفاصيل التحويل",
  "Cheque details": "تفاصيل الشيك",
  "Linked treasury data, OCR evidence, approvals, journal readiness, and reconciliation context.":
    "بيانات الخزينة والإثبات والاعتمادات وجاهزية القيد وسياق التسوية.",
  "Core instrument data": "البيانات الأساسية للأداة المالية",
  "Issue/Transfer Date": "تاريخ الإصدار/التحويل",
  "Due / Settlement": "الاستحقاق / التسوية",
  "Approved By": "معتمد من",
  "Pending approval": "في انتظار الاعتماد",
  "Reconciled": "تم التسوية",
  "Linked business records": "سجلات الأعمال المرتبطة",
  "Ready to map": "جاهز للربط",
  "Posting": "للترحيل",
  "Document and OCR context": "الوثيقة وسياق المسح الضوئي",
  "Attachments": "المرفقات",
  "OCR extraction": "استخراج المسح الضوئي",
  "Not captured": "ما تم التقاطه",
  "Created By": "أنشأه",
  "Last Updated": "آخر تحديث",
  "OCR review": "مراجعة المسح الضوئي",
  "Review extracted cheque or transfer fields, confirm confidence, and save manual corrections with audit history.":
    "راجع الحقول المستخرجة، أكّد الثقة، واحفظ التصحيحات اليدوية مع سجل المراجعة.",
  "Provider": "المزود",
  "Average confidence": "متوسط الثقة",
  "Extracted": "المستخرج",
  "Corrected value": "القيمة المصحّحة",
  "Save OCR corrections": "احفظ تصحيحات المسح",
  "Your role cannot approve cheque actions.": "دورك ما يسمح باعتماد الشيكات.",
  "Your role cannot verify bank transfers.": "دورك ما يسمح بالتحقق من التحويلات.",
  "Your role cannot correct OCR data.": "دورك ما يسمح بتصحيح بيانات المسح.",
  "Cheque approval recorded.": "تم تسجيل اعتماد الشيك.",
  "Bank transfer verified.": "تم التحقق من التحويل البنكي.",
  "OCR corrections saved and audited.": "تم حفظ تصحيحات المسح وتسجيلها.",
  "High confidence": "ثقة عالية",
  "Medium confidence": "ثقة متوسطة",
  "Needs review": "تحتاج مراجعة",
  "Unapplied": "غير مطبّق",
  "No payable link": "ما في رابط دفع",
  "Not mapped": "غير مربوط",
  "Cheque": "شيك",
  "OCR": "قراءة الشيك",
  "Journal": "القيد المحاسبي",
  "No OCR": "ما في قراءة",
  "Bank Accounts": "الحسابات البنكية",
  "Bank Transfers": "التحويلات البنكية",
  "Cash Flow": "التدفق النقدي",
  "Account Balance": "رصيد الحساب",
  "Opening Balance": "الرصيد الافتتاحي",
  "Closing Balance": "الرصيد الختامي",
  "Deposit": "إيداع",
  "Withdrawal": "سحب",
  "Transfer": "تحويل",
  "Reconciliation": "التسوية",
  "Bank Statement": "كشف الحساب",
  "Cheque Number": "رقم الشيك",
  "Bank Name": "اسم البنك",
  "Branch": "الفرع",
  "Account Number": "رقم الحساب",
  "IBAN": "الآيبان",
  "Swift Code": "كود السويفت",
  "Outgoing": "صادر",
  "Incoming": "وارد",
  "Cleared": "تم صرفه",
  "Bounced": "مرتجع",
  "In Clearance": "تحت التحصيل",
  "Petty Cash": "صندوق النثريات",
  "New Transfer": "تحويل جديد",
  "Register Cheque": "سجّل شيك",
  "New Bank Account": "حساب بنكي جديد",

  // ── EMPLOYEES PAGE ───────────────────────────────────────────
  "Team Management": "إدارة الفريق",
  "Add Employee": "أضف موظف",
  "Employee Details": "تفاصيل الموظف",
  "Attendance": "الحضور",
  "Daily Sheet": "كشف يومي",
  "Monthly Report": "تقرير شهري",
  "Payroll": "الرواتب",
  "Check In": "تسجيل حضور",
  "Check Out": "تسجيل انصراف",
  "Work Hours": "ساعات العمل",
  "Overtime": "وقت إضافي",
  "Leave Request": "طلب إجازة",
  "Annual Leave": "إجازة سنوية",
  "Sick Leave": "إجازة مرضية",
  "Days Present": "أيام الحضور",
  "Days Absent": "أيام الغياب",
  "Days Late": "أيام التأخير",
  "Total Hours": "مجموع الساعات",
  "Net Salary": "صافي الراتب",
  "Basic Salary": "الراتب الأساسي",
  "Deductions": "الاستقطاعات",
  "Bonuses": "المكافآت",
  "Employee ID": "رقم الموظف",
  "Join Date": "تاريخ الانضمام",
  "End Date": "تاريخ الانتهاء",
  "No employees found": "ما في موظفين",
  "Add your first employee to get started.": "أضف أول موظف للبداية.",
  "Search employees...": "ابحث في الموظفين...",
  "All Departments": "كل الأقسام",
  "Full Time": "دوام كامل",
  "Part Time": "دوام جزئي",
  "Contract": "عقد",
  "Freelance": "مستقل",
  "Generate Payroll": "احسب الرواتب",
  "Export Attendance": "صدّر الحضور",
  "Mark Present": "علّم حاضر",
  "Mark Absent": "علّم غايب",
  "Today Attendance": "حضور اليوم",
  "Monthly Attendance": "الحضور الشهري",
  "Reports": "التقارير",
  "Employees": "الموظفين",
  "Search employee...": "ابحث عن موظف...",
  "Choose the date, prepare the day, then edit only the exceptions.": "اختار التاريخ وجهّز اليوم، عدّل الاستثناءات بس.",
  "Prepare Day": "جهّز اليوم",
  "Save Day": "احفظ اليوم",
  "Present": "حاضر",
  "Absent": "غايب",
  "Advances Today": "سلف اليوم",
  "Edit only employees who differ from the default attendance.": "عدّل الموظفين اللي بيختلفوا عن الحضور الافتراضي بس.",
  "Hours": "الساعات",
  "Advance": "سلفة",
  "Optional note": "ملاحظة اختيارية",
  "Click any day for any employee to edit status, hours, advance, and notes.": "اضغط على أي يوم لأي موظف لتعديل الحالة والساعات والسلفة والملاحظات.",

  // ── DASHBOARD PAGE ───────────────────────────────────────────
  "Business Control Center": "مركز التحكم",
  "Revenue, collections, invoices, stock, and team signals in one compact command view.":
    "الإيرادات والتحصيلات والفواتير والمخزن وإشارات الفريق في شاشة واحدة.",
  "Business performance": "أداء الأعمال",
  "Live overview": "نظرة مباشرة",
  "Synced": "محدّث",
  "Revenue": "الإيرادات",
  "Outstanding invoices": "فواتير معلقة",
  "Open invoices": "فواتير مفتوحة",
  "Stock alerts": "تنبيهات المخزن",
  "Cash flow": "التدفق النقدي",
  "Last 8 periods": "آخر 8 فترات",
  "Need follow-up": "تحتاج متابعة",
  "Quick Actions": "إجراءات سريعة",
  "Recent Activity": "آخر النشاطات",
  "Top Products": "أفضل المنتجات",
  "Recent Customers": "آخر الزباين",
  "Recent Invoices": "آخر الفواتير",
  "Revenue this month": "إيرادات هالشهر",
  "Active customers": "زباين نشطين",
  "Invoices issued": "فواتير صادرة",
  "Inventory health": "حالة المخزن",
  "+12.4% this month": "+12.4% هالشهر",
  "vs last month": "مقارنة بالشهر الماضي",
  "Today": "اليوم",
  "Week": "الأسبوع",
  "Month": "الشهر",
  "Add Customer": "أضف زبون",
  "Smart Brief": "ملخص ذكي",
  "Operational summary": "ملخص تشغيلي",
  "Short risk, opportunity, and AI-ready actions for the current view.":
    "المخاطر والفرص وإجراءات ذكية للعرض الحالي.",
  "Ask AI": "اسأل الذكاء",
  "Live Preview": "معاينة مباشرة",
  "Operational previews": "معاينات تشغيلية",
  "Use these live snapshots as shortcuts into the busiest modules.":
    "استخدم هذه المعاينات المباشرة كاختصارات للوحدات الأكثر نشاطاً.",
  "Key Totals": "المجاميع الرئيسية",
  "Topline view": "نظرة إجمالية",
  "Signals": "إشارات",
  "Requiring attention": "تحتاج انتباه",
  "Pause alerts": "أوقف التنبيهات",
  "Resume alerts": "أعِد التنبيهات",
  "AI Shortcuts": "اختصارات الذكاء",
  "Focused drill-down": "تحليل مركّز",

  // ── DATA IMPORT PAGE ─────────────────────────────────────────
  "Data Import": "استيراد البيانات",
  "Upload your CSV or Excel file to import data into the system.":
    "ارفع ملف CSV أو Excel لاستيراد البيانات للنظام.",
  "Drag and drop your file here, or click to browse":
    "اسحب وأفلت الملف هون، أو اضغط للاختيار",
  "Supported formats: CSV, XLSX, XLS": "الأنواع المدعومة: CSV، XLSX، XLS",
  "Validate": "تحقق",
  "Import Data": "استورد البيانات",
  "Import History": "تاريخ الاستيراد",
  "Download Template": "نزّل النموذج",
  "Field Mapping": "ربط الحقول",
  "Preview Data": "معاينة البيانات",
  "Rows detected": "صفوف مكتشفة",
  "Errors found": "أخطاء موجودة",
  "Ready to import": "جاهز للاستيراد",
  "Import successful": "تم الاستيراد بنجاح",
  "Import failed": "فشل الاستيراد",
  "Map columns": "اربط الأعمدة",
  "Skip column": "تجاهل العمود",
  "Required field": "حقل إجباري",
  "Optional field": "حقل اختياري",

  // ── SETTINGS PAGE ────────────────────────────────────────────
  "System Settings": "إعدادات النظام",
  "Language": "اللغة",
  "Theme": "المظهر",
  "Light": "فاتح",
  "Dark": "داكن",
  "English": "English",
  "Arabic": "العربية",
  "Current language": "اللغة الحالية",
  "Current mode": "الوضع الحالي",
  "Appearance": "المظهر",
  "Workspace": "مساحة العمل",
  "Configuration status": "حالة الإعداد",
  "Core preferences active": "الإعدادات الأساسية مفعّلة",
  "Foundation ready": "الأساس جاهز",

  // ── AI ASSISTANT ─────────────────────────────────────────────
  "AI Copilot": "المساعد الذكي",
  "Ask AI anything...": "اسأل المساعد الذكي أي شي...",
  "Analyzing...": "بحلّل...",
  "Thinking...": "بفكّر...",
  "Ask me anything about your business data": "اسألني أي شي عن بيانات شغلك",

  // ── KEYBOARD SHORTCUTS OVERLAY ───────────────────────────────
  "Keyboard Shortcuts": "اختصارات لوحة المفاتيح",
  "Navigate": "تنقّل",
  "Create": "إنشاء",
  "General": "عام",
  "Appearance": "المظهر",
  "System": "النظام",
  "Focus search": "انتقل للبحث",
  "Show this help": "عرض المساعدة",
  "Toggle dark mode": "تبديل الوضع الداكن",
  "Sign out": "تسجيل الخروج",
  "Light mode": "وضع فاتح",
  "Dark mode": "وضع داكن",

  // ── LOGOUT CONFIRM ───────────────────────────────────────────
  "Sign out?": "تسجيل الخروج؟",
  "Press Enter to confirm or Esc to cancel":
    "اضغط Enter للتأكيد أو Esc للإلغاء",

  // ── FORM SECTIONS ────────────────────────────────────────────
  "Basic Information": "المعلومات الأساسية",
  "Financial Details": "التفاصيل المالية",
  "Contact Information": "معلومات التواصل",
  "Additional Information": "معلومات إضافية",
  "Shipping Information": "معلومات الشحن",
  "Payment Information": "معلومات الدفع",
  "Product Information": "معلومات المنتج",
  "Pricing": "التسعير",
  "Inventory": "المخزن",

  // ── MESSAGES / TOASTS ────────────────────────────────────────
  "Saved successfully": "تم الحفظ بنجاح",
  "Deleted successfully": "تم الحذف بنجاح",
  "Updated successfully": "تم التعديل بنجاح",
  "Created successfully": "تم الإنشاء بنجاح",
  "Something went wrong": "في مشكلة صارت",
  "Please try again": "جرّب مرة ثانية",
  "No results found": "ما لقينا نتائج",
  "Are you sure?": "متأكد؟",
  "This action cannot be undone.": "هاي العملية ما بترجع.",
  "Type 123 to confirm": "اكتب 123 للتأكيد",

  // ── PAGINATION ───────────────────────────────────────────────
  "No OCR": "ما في قراءة",
  "All invoices": "كل الفواتير",
};

// ── DYNAMIC TRANSLATION RULES ────────────────────────────────
const dynamicRules: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Showing ([0-9,\-]+) of ([0-9,]+)$/i,
    (m) => `عرض ${m[1]} من ${m[2]}`],
  [/^Showing ([0-9,]+) (customer|customers|payment|payments|invoice|invoices|record|records|product|products|supplier|suppliers|employee|employees) in the current view$/i,
    (m) => `يعرض ${m[1]} سجل`],
  [/^([0-9,]+) (result|results)$/i,
    (m) => `${m[1]} نتيجة`],
  [/^([0-9,]+) (records?|items?) in this view$/i,
    (m) => `${m[1]} سجل في هذا العرض`],
  [/^([0-9,]+) selected$/i,
    (m) => `${m[1]} محدد`],
  [/^Showing all ([0-9,]+) (purchases|invoices|payments|products|customers|suppliers|employees)$/i,
    (m) => `عرض كل الـ ${m[1]}`],
  [/^Open actions for (.+)$/i,
    (m) => `إجراءات ${m[1]}`],
  [/^Select (.+)$/i,
    (m) => `اختار ${m[1]}`],
  [/^Select all visible (.+)$/i,
    (m) => `اختار كل ${m[1]} الظاهرة`],
  [/^([0-9,]+) (match|matches)$/i,
    (m) => `${m[1]} نتيجة`],
  [/^([0-9]+) days? (ago|overdue)$/i,
    (m) => `منذ ${m[1]} يوم`],
  [/^In ([0-9]+) days?$/i,
    (m) => `بعد ${m[1]} يوم`],
  [/^([0-9]+)% received$/i,
    (m) => `${m[1]}% مستلم`],
  [/^([0-9]+) items?$/i,
    (m) => `${m[1]} بند`],
  [/^Showing ([0-9,]+) invoice[s]?$/i,
    (m) => `يعرض ${m[1]} فاتورة`],
  [/^([0-9,]+) invoice[s]?$/i,
    (m) => `${m[1]} فاتورة`],
  [/^([0-9,]+) result[s]?$/i,
    (m) => `${m[1]} نتيجة`],
  [/^([0-9,]+) results?$/i,
    (m) => `${m[1]} نتيجة`],
  [/^Across ([0-9,]+) active treasury accounts?$/i,
    (m) => `عبر ${m[1]} حساب خزينة نشط`],
  [/^([0-9,]+) items? need manual validation$/i,
    (m) => `${m[1]} بند يحتاج مراجعة يدوية`],
  [/^Invoice (#?\w+)$/i,
    (m) => `فاتورة ${m[1]}`],
  [/^Purchase (#?\w+)$/i,
    (m) => `طلبية ${m[1]}`],
  [/^([0-9,]+) file[s]?$/i,
    (m) => `${m[1]} ملف`],
  [/^Overdue by ([0-9]+) days?$/i,
    (m) => `متأخر بـ ${m[1]} يوم`],
  [/^Due in ([0-9]+) days?$/i,
    (m) => `يستحق بعد ${m[1]} يوم`],
  [/^Due today$/i,
    () => `مستحق اليوم`],
  [/^Due tomorrow$/i,
    () => `مستحق غداً`],
  [/^No date$/i,
    () => `بدون تاريخ`],
  [/^([0-9,]+) bounced? cheques?$/i,
    (m) => `${m[1]} شيك مرتجع`],
  [/^([0-9,]+) transfers? pending verification$/i,
    (m) => `${m[1]} تحويل في انتظار التحقق`],
  [/^([0-9,]+) instruments? due within 3 days?$/i,
    (m) => `${m[1]} أداة مالية تستحق خلال 3 أيام`],
  [/^Settles (.+)$/i,
    (m) => `يُسوَّى ${m[1]}`],
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
