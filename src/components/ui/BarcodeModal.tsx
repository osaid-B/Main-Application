import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, Printer, X } from "lucide-react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import "./BarcodeModal.css";
import type { Product } from "../../data/types";
import { useToast } from "./Toast";

interface BarcodeModalProps {
  product: Pick<Product, "id" | "name" | "barcode" | "code" | "price">;
  onClose: () => void;
}

const BARCODE_DOMAIN = window.location.origin;

export function BarcodeModal({ product, onClose }: BarcodeModalProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const { toast } = useToast();

  const barcode = product.barcode ?? `6240${product.id.replace(/\D/g, "").slice(0, 9).padStart(9, "0")}`;
  const qrUrl = `${BARCODE_DOMAIN}/products/barcode/${barcode}`;

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, barcode, {
        format: "EAN13",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 8,
        background: "#ffffff",
        lineColor: "#000000",
      });
    }
  }, [barcode]);

  useEffect(() => {
    QRCode.toDataURL(qrUrl, {
      width: 120,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((url) => setQrDataUrl(url)).catch(() => {/* silent */});
  }, [qrUrl]);

  function handleCopy() {
    navigator.clipboard.writeText(barcode).then(() => {
      toast("تم نسخ الباركود ✓", { type: "success" });
    }).catch(() => {
      toast("فشل النسخ", { type: "error" });
    });
  }

  function handlePrint() {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const printWindow = window.open("", "_blank", "width=400,height=300");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode — ${product.name}</title>
          <style>
            @page { size: 5cm 3cm; margin: 0; }
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 5cm; height: 3cm; font-family: Arial, sans-serif; }
            .label-name { font-size: 9pt; font-weight: 700; text-align: center; margin-bottom: 2pt; max-width: 4.5cm; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
            .label-price { font-size: 8pt; margin-bottom: 3pt; }
            svg { max-width: 4.5cm; }
          </style>
        </head>
        <body>
          <div class="label-name">${product.name}</div>
          <div class="label-price">₪${(product.price ?? 0).toFixed(2)}</div>
          ${svgData}
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function handleDownload() {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const svgSize = svgEl.getBoundingClientRect();
    canvas.width = svgSize.width * 2;
    canvas.height = svgSize.height * 2;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      const safeName = product.name.replace(/\s+/g, "-").slice(0, 30);
      link.download = `barcode-${product.code ?? product.id}-${safeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div className="barcode-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Barcode">
      <div className="barcode-modal-panel">
        <div className="barcode-modal-header">
          <div>
            <strong className="barcode-modal-title">باركود المنتج</strong>
            <p className="barcode-modal-subtitle">{product.name}</p>
          </div>
          <button type="button" className="barcode-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={14} />
          </button>
        </div>

        <div className="barcode-modal-body">
          {/* Barcode SVG */}
          <div className="barcode-svg-wrap">
            <svg ref={svgRef} />
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div className="barcode-qr-wrap">
              <img src={qrDataUrl} alt="QR Code" width={100} height={100} />
              <p className="barcode-qr-label">QR → صفحة المنتج</p>
            </div>
          )}
          <canvas ref={qrCanvasRef} style={{ display: "none" }} />

          {/* Barcode value */}
          <div className="barcode-value-row">
            <code className="barcode-value-code">{barcode}</code>
            <button type="button" className="barcode-copy-inline-btn" onClick={handleCopy}>
              <Copy size={12} />
            </button>
          </div>
        </div>

        <div className="barcode-modal-actions">
          <button type="button" className="barcode-action-btn" onClick={handleCopy}>
            <Copy size={14} />
            نسخ الرمز
          </button>
          <button type="button" className="barcode-action-btn" onClick={handlePrint}>
            <Printer size={14} />
            طباعة
          </button>
          <button type="button" className="barcode-action-btn barcode-action-btn--primary" onClick={handleDownload}>
            <Download size={14} />
            تحميل PNG
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
