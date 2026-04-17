import { useMemo, useState } from "react";
import { importValidRowsIntoSystem } from "./utils/importUtils";

type ImportEntity = "customers" | "products" | "invoices" | "payments";
type ParsedRow = Record<string, string>;

type ImportResult = {
  importedCount: number;
  skippedCount: number;
  message: string;
};

function parseCsv(text: string): ParsedRow[] {
  if (!text.trim()) return [];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: ParsedRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

export default function DataImport() {
  const [entity, setEntity] = useState<ImportEntity>("customers");
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const parsedRows = useMemo(() => parseCsv(rawText), [rawText]);

  const handleImport = () => {
    const importResult = importValidRowsIntoSystem(entity, parsedRows);
    setResult(importResult);
  };

  return (
    <div className="data-import-page">
      <h1>Data Import</h1>

      <div className="form-group">
        <label htmlFor="entity">Entity Type</label>
        <select
          id="entity"
          value={entity}
          onChange={(e) => setEntity(e.target.value as ImportEntity)}
        >
          <option value="customers">Customers</option>
          <option value="products">Products</option>
          <option value="invoices">Invoices</option>
          <option value="payments">Payments</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="csvData">Paste CSV Data</label>
        <textarea
          id="csvData"
          rows={12}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`name,phone,email
Ahmad,0599999999,ahmad@email.com`}
        />
      </div>

      <button onClick={handleImport}>Import</button>

      {result && (
        <div className="import-result">
          <p>{result.message}</p>
          <p>Imported: {result.importedCount}</p>
          <p>Skipped: {result.skippedCount}</p>
        </div>
      )}
    </div>
  );
}