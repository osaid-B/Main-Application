import { useMemo, useState } from "react";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useSettings } from "../context/SettingsContext";
import styles from "./AuditLog.module.css";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: "create" | "edit" | "delete" | "export" | "login";
  actionAr: string;
  entity: string;
  entityAr: string;
  detail: string;
  detailAr: string;
}

const MOCK_ENTRIES: AuditEntry[] = [
  { id: "a1",  timestamp: "2026-05-30 09:14", user: "أحمد سعيد",    action: "create", actionAr: "إنشاء",   entity: "Invoice",    entityAr: "فاتورة",    detail: "FAT-1042 — ₪3,200",        detailAr: "FAT-1042 — ₪٣٬٢٠٠"         },
  { id: "a2",  timestamp: "2026-05-30 09:08", user: "سلمى يوسف",    action: "edit",   actionAr: "تعديل",   entity: "Customer",   entityAr: "زبون",      detail: "أبو خضر وأولاده",           detailAr: "أبو خضر وأولاده"            },
  { id: "a3",  timestamp: "2026-05-30 08:55", user: "محمد الخالد",  action: "delete", actionAr: "حذف",     entity: "Product",    entityAr: "منتج",      detail: "SKU-0391 — طماطم مجفف",     detailAr: "SKU-0391 — طماطم مجفف"     },
  { id: "a4",  timestamp: "2026-05-30 08:40", user: "أحمد سعيد",    action: "export", actionAr: "تصدير",   entity: "Report",     entityAr: "تقرير",     detail: "تقرير الإيرادات - أبريل",   detailAr: "تقرير الإيرادات - أبريل"   },
  { id: "a5",  timestamp: "2026-05-30 08:22", user: "نادين حمود",   action: "login",  actionAr: "دخول",    entity: "System",     entityAr: "النظام",    detail: "تسجيل دخول ناجح",           detailAr: "تسجيل دخول ناجح"           },
  { id: "a6",  timestamp: "2026-05-29 17:50", user: "سلمى يوسف",    action: "create", actionAr: "إنشاء",   entity: "Payment",    entityAr: "دفعة",      detail: "PAY-0558 — ₪1,500",        detailAr: "PAY-0558 — ₪١٬٥٠٠"        },
  { id: "a7",  timestamp: "2026-05-29 16:35", user: "محمد الخالد",  action: "edit",   actionAr: "تعديل",   entity: "Invoice",    entityAr: "فاتورة",    detail: "FAT-1038 — تعديل المبلغ",   detailAr: "FAT-1038 — تعديل المبلغ"   },
  { id: "a8",  timestamp: "2026-05-29 15:10", user: "أحمد سعيد",    action: "create", actionAr: "إنشاء",   entity: "Customer",   entityAr: "زبون",      detail: "شركة الشمال التجارية",      detailAr: "شركة الشمال التجارية"      },
  { id: "a9",  timestamp: "2026-05-29 14:22", user: "نادين حمود",   action: "delete", actionAr: "حذف",     entity: "Invoice",    entityAr: "فاتورة",    detail: "FAT-1031 — مسودة",          detailAr: "FAT-1031 — مسودة"          },
  { id: "a10", timestamp: "2026-05-29 13:05", user: "سلمى يوسف",    action: "edit",   actionAr: "تعديل",   entity: "Product",    entityAr: "منتج",      detail: "SKU-0112 — تحديث السعر",    detailAr: "SKU-0112 — تحديث السعر"   },
  { id: "a11", timestamp: "2026-05-29 11:44", user: "محمد الخالد",  action: "export", actionAr: "تصدير",   entity: "Inventory",  entityAr: "مخزون",     detail: "تصدير بيانات المخزون",      detailAr: "تصدير بيانات المخزون"      },
  { id: "a12", timestamp: "2026-05-29 10:30", user: "أحمد سعيد",    action: "login",  actionAr: "دخول",    entity: "System",     entityAr: "النظام",    detail: "تسجيل دخول ناجح",           detailAr: "تسجيل دخول ناجح"           },
  { id: "a13", timestamp: "2026-05-28 16:10", user: "نادين حمود",   action: "create", actionAr: "إنشاء",   entity: "Invoice",    entityAr: "فاتورة",    detail: "FAT-1040 — ₪7,800",        detailAr: "FAT-1040 — ₪٧٬٨٠٠"        },
  { id: "a14", timestamp: "2026-05-28 14:55", user: "سلمى يوسف",    action: "edit",   actionAr: "تعديل",   entity: "Customer",   entityAr: "زبون",      detail: "مؤسسة الوفاء",              detailAr: "مؤسسة الوفاء"              },
  { id: "a15", timestamp: "2026-05-28 12:20", user: "محمد الخالد",  action: "delete", actionAr: "حذف",     entity: "Payment",    entityAr: "دفعة",      detail: "PAY-0550 — مكرر",           detailAr: "PAY-0550 — مكرر"           },
];

const ACTION_COLORS: Record<AuditEntry["action"], string> = {
  create: styles.actionCreate,
  edit:   styles.actionEdit,
  delete: styles.actionDelete,
  export: styles.actionExport,
  login:  styles.actionLogin,
};

const PAGE_SIZE = 10;

export default function AuditLog() {
  const { isArabic } = useSettings();
  const [search, setSearch]       = useState("");
  const [filterAction, setAction] = useState("all");
  const [filterEntity, setEntity] = useState("all");
  const [page, setPage]           = useState(1);

  const filtered = useMemo(() => {
    return MOCK_ENTRIES.filter((e) => {
      const matchSearch =
        !search ||
        e.user.includes(search) ||
        e.detail.includes(search) ||
        e.detailAr.includes(search);
      const matchAction = filterAction === "all" || e.action === filterAction;
      const matchEntity = filterEntity === "all" || e.entity === filterEntity;
      return matchSearch && matchAction && matchEntity;
    });
  }, [search, filterAction, filterEntity]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEntries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilterChange() {
    setPage(1);
  }

  const entityOptions = [
    { value: "all",       label: isArabic ? "كل الكيانات"  : "All entities"  },
    { value: "Invoice",   label: isArabic ? "فاتورة"       : "Invoice"       },
    { value: "Payment",   label: isArabic ? "دفعة"         : "Payment"       },
    { value: "Customer",  label: isArabic ? "زبون"         : "Customer"      },
    { value: "Product",   label: isArabic ? "منتج"         : "Product"       },
    { value: "Inventory", label: isArabic ? "مخزون"        : "Inventory"     },
    { value: "Report",    label: isArabic ? "تقرير"        : "Report"        },
    { value: "System",    label: isArabic ? "النظام"       : "System"        },
  ];

  const actionOptions = [
    { value: "all",    label: isArabic ? "كل الإجراءات" : "All actions" },
    { value: "create", label: isArabic ? "إنشاء"        : "Create"      },
    { value: "edit",   label: isArabic ? "تعديل"        : "Edit"        },
    { value: "delete", label: isArabic ? "حذف"          : "Delete"      },
    { value: "export", label: isArabic ? "تصدير"        : "Export"      },
    { value: "login",  label: isArabic ? "دخول"         : "Login"       },
  ];

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <p className={styles.subtitle}>
            {isArabic ? "سجل جميع الإجراءات التي نفّذها المستخدمون" : "Read-only record of all user actions"}
          </p>
        </header>

        <div className={styles.filters}>
          <Input
            placeholder={isArabic ? "بحث بالمستخدم أو التفاصيل…" : "Search user or detail…"}
            value={search}
            onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
            className={styles.searchInput}
          />
          <Select
            value={filterAction}
            onChange={(e) => { setAction(e.target.value); handleFilterChange(); }}
            options={actionOptions}
          />
          <Select
            value={filterEntity}
            onChange={(e) => { setEntity(e.target.value); handleFilterChange(); }}
            options={entityOptions}
          />
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{isArabic ? "التوقيت"   : "Timestamp"}</th>
                <th>{isArabic ? "المستخدم"  : "User"     }</th>
                <th>{isArabic ? "الإجراء"   : "Action"   }</th>
                <th>{isArabic ? "الكيان"    : "Entity"   }</th>
                <th>{isArabic ? "التفاصيل"  : "Detail"   }</th>
              </tr>
            </thead>
            <tbody>
              {pageEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    {isArabic ? "لا توجد نتائج" : "No results"}
                  </td>
                </tr>
              ) : pageEntries.map((e) => (
                <tr key={e.id}>
                  <td className={styles.tsCell}>{e.timestamp}</td>
                  <td className={styles.userCell}>{e.user}</td>
                  <td>
                    <span className={`${styles.actionBadge} ${ACTION_COLORS[e.action]}`}>
                      {isArabic ? e.actionAr : e.action}
                    </span>
                  </td>
                  <td className={styles.entityCell}>
                    {isArabic ? e.entityAr : e.entity}
                  </td>
                  <td className={styles.detailCell}>
                    {isArabic ? e.detailAr : e.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {isArabic ? "السابق" : "Prev"}
            </button>
            <span className={styles.pageInfo}>
              {isArabic
                ? `${page} من ${totalPages}`
                : `${page} / ${totalPages}`}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {isArabic ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </Stack>
    </Container>
  );
}
