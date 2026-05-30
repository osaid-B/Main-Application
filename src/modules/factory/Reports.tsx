
export default function FactoryReports() {
  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">المصنع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">التقارير</span>
          </nav>
          <p className="page-desc">تقارير الإنتاج والتكاليف والجودة</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-4)' }}>
        <div className="report-card">
          <div className="report-card__title">تقرير الإنتاج</div>
          <p className="report-card__desc">ملخص أوامر الإنتاج والكميات المنتجة لفترة محددة</p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>
        <div className="report-card">
          <div className="report-card__title">تقرير التكاليف</div>
          <p className="report-card__desc">تحليل تكاليف الإنتاج وهوامش الربح للمنتجات</p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>
        <div className="report-card">
          <div className="report-card__title">تقرير الجودة</div>
          <p className="report-card__desc">معدلات النجاح والفشل في فحوصات الجودة</p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>
      </div>
    </div>
  );
}
