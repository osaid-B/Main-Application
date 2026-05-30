import { useNavigate } from "react-router-dom";
import { useModule, MODULE_META, type ModuleId } from "../context/ModuleContext";

export default function ModuleSelector() {
  const navigate = useNavigate();
  const { setActiveModule, userModules } = useModule();

  function enter(id: ModuleId) {
    setActiveModule(id);
    navigate(MODULE_META[id].homeRoute);
  }

  return (
    <div className="module-selector">
      <div className="module-selector__header">
        <div className="module-selector__logo">⚡ أطلس</div>
        <p className="module-selector__sub">أطلس لإدارة الأعمال — اختر الوحدة</p>
      </div>

      <div className="module-selector__grid">
        {userModules.map((id) => {
          const m = MODULE_META[id];
          return (
            <button
              key={id}
              type="button"
              className="module-card"
              onClick={() => enter(id)}
            >
              <div
                className="module-card__top"
                style={{ background: m.gradient }}
              >
                <span className="module-card__icon">{m.icon}</span>
                <span className="module-card__name">{m.name}</span>
              </div>
              <div className="module-card__bottom">
                <p className="module-card__desc">{m.desc}</p>
                <div className="module-card__enter" style={{ color: m.primaryVar }}>
                  ادخل
                  <span>←</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
