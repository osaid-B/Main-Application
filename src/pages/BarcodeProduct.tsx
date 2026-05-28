import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import { getProducts } from "../data/storage";
import type { Product } from "../data/types";
import "./BarcodeProduct.css";

function getStatusLabel(stock: number, minStock: number) {
  if (stock <= 0) return { label: "نفد المخزون", cls: "bp-badge--out" };
  if (stock <= minStock) return { label: "مخزون منخفض", cls: "bp-badge--low" };
  return { label: "متوفر", cls: "bp-badge--in" };
}

export default function BarcodeProduct() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const product = useMemo<Product | null>(() => {
    if (!code) return null;
    const all = getProducts();
    return all.find((p) => p.barcode === code || p.code === code) ?? null;
  }, [code]);

  useEffect(() => {
    if (!code || !product) return;
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, code, {
          format: "EAN13",
          width: 2,
          height: 56,
          displayValue: true,
          fontSize: 11,
          margin: 8,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch {/* non-EAN13 codes handled gracefully */}
    }
    QRCode.toDataURL(window.location.href, { width: 100, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => {/* silent */});
  }, [code, product]);

  if (product === null) {
    return (
      <div className="bp-container">
        <button type="button" className="bp-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> رجوع
        </button>
        <div className="bp-not-found">
          <Package size={40} />
          <h2>المنتج غير موجود</h2>
          <p>الباركود: <code>{code}</code></p>
        </div>
      </div>
    );
  }

  const minStock = product.minStock ?? product.reorderThreshold ?? 5;
  const { label: statusLabel, cls: statusCls } = getStatusLabel(product.stock ?? 0, minStock);

  return (
    <div className="bp-container" dir="rtl">
      <button type="button" className="bp-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> رجوع
      </button>

      <div className="bp-card">
        {/* Image placeholder */}
        <div className="bp-image-wrap">
          <Package size={48} className="bp-image-icon" />
        </div>

        <div className="bp-info">
          <h1 className="bp-name">{product.name}</h1>

          <div className="bp-meta-row">
            {product.code && <span className="bp-meta-item"><strong>SKU:</strong> {product.code}</span>}
            {product.category && <span className="bp-meta-item"><strong>الفئة:</strong> {product.category}</span>}
          </div>

          <div className="bp-price-row">
            <span className="bp-price">₪{(product.price ?? 0).toFixed(2)}</span>
            <span className={`bp-badge ${statusCls}`}>{statusLabel}</span>
          </div>

          <div className="bp-stock-row">
            <span>المخزون:</span>
            <strong>{product.stock ?? 0} وحدة</strong>
          </div>
        </div>

        {/* Barcode */}
        <div className="bp-barcode-section">
          <div className="bp-barcode-wrap">
            <svg ref={svgRef} />
          </div>
          {qrDataUrl && (
            <div className="bp-qr-wrap">
              <img src={qrDataUrl} alt="QR Code" width={80} height={80} />
              <p className="bp-qr-caption">امسح لفتح الصفحة</p>
            </div>
          )}
        </div>

        <div className="bp-actions">
          <button type="button" className="bp-btn bp-btn--primary" onClick={() => navigate("/pos/checkout")}>
            <ShoppingCart size={14} /> إضافة للسلة
          </button>
          <button type="button" className="bp-btn" onClick={() => navigate("/products")}>
            عرض المنتج الكامل
          </button>
        </div>
      </div>
    </div>
  );
}
