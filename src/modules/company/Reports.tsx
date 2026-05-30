import { useNavigate } from "react-router-dom";

export default function ReportsPage() {
  const navigate = useNavigate();

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">الشركة</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">التقارير</span>
          </nav>
          <p className="page-desc">التقارير المالية والتشغيلية</p>
        </div>
      </div>

      <div className="report-grid">
        <div
          className="report-card"
          onClick={() => navigate("/company/reports/profit-loss")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/company/reports/profit-loss");
            }
          }}
        >
          <div className="report-card__title">الأرباح والخسائر</div>
          <p className="report-card__desc">
            عرض قائمة الدخل والمصروفات لفترة زمنية محددة
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>

        <div
          className="report-card"
          onClick={() => navigate("/company/reports/sales")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/company/reports/sales");
            }
          }}
        >
          <div className="report-card__title">تقرير المبيعات</div>
          <p className="report-card__desc">
            مبيعات حسب الفترة الزمنية والزبون
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>

        <div
          className="report-card"
          onClick={() => navigate("/company/reports/expenses")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/company/reports/expenses");
            }
          }}
        >
          <div className="report-card__title">تقرير المصروفات</div>
          <p className="report-card__desc">
            تحليل المصروفات حسب الفئة والفترة
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>

        <div
          className="report-card"
          onClick={() => navigate("/company/reports/customers")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/company/reports/customers");
            }
          }}
        >
          <div className="report-card__title">تقرير الزبائن</div>
          <p className="report-card__desc">
            أفضل الزبائن وتحليل الأرصدة المستحقة
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>
      </div>
    </div>
  );
}
