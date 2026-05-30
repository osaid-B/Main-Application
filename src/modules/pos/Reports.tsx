export default function Reports() {
  return (
    <div className="module-pos page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">نقطة البيع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">التقارير</span>
          </nav>
          <p className="page-desc">تقارير المبيعات وأداء الكاشيرين والمنتجات</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-4)",
        }}
      >
        <div className="report-card">
          <div className="report-card__title">تقرير المبيعات اليومي</div>
          <p className="report-card__desc">
            ملخص مبيعات اليوم حسب الساعة وطريقة الدفع
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>

        <div className="report-card">
          <div className="report-card__title">أكثر المنتجات مبيعاً</div>
          <p className="report-card__desc">
            قائمة المنتجات الأكثر مبيعاً خلال الفترة المحددة
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>

        <div className="report-card">
          <div className="report-card__title">أداء الكاشيرين</div>
          <p className="report-card__desc">
            مقارنة أداء الكاشيرين من حيث المبيعات والمعاملات
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>

        <div className="report-card">
          <div className="report-card__title">تقرير المخزون</div>
          <p className="report-card__desc">
            حالة مخزون المنتجات والمنتجات التي تقترب من النفاد
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>

        <div className="report-card">
          <div className="report-card__title">تقرير المستردات</div>
          <p className="report-card__desc">
            تفاصيل عمليات الاسترداد وأسبابها خلال الفترة المحددة
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>

        <div className="report-card">
          <div className="report-card__title">تقرير برنامج الولاء</div>
          <p className="report-card__desc">
            إحصائيات نقاط الولاء المكتسبة والمستردة لكل فترة
          </p>
          <div className="report-card__link">عرض التقرير ←</div>
        </div>
      </div>
    </div>
  );
}
