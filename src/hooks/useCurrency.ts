import { DEFAULT_EXCHANGE_RATES, type CurrencyCode } from "../config/palestineConfig";
import { formatCurrencyValue, formatNumberValue } from "../utils/displayFormatters";

export function formatCurrency(amount: number, currency: CurrencyCode = "ILS"): string {
  try {
    return formatCurrencyValue(amount, currency);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(amount: number, decimals = 2): string {
  try {
    return formatNumberValue(amount, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch {
    return amount.toFixed(decimals);
  }
}

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  const rate = DEFAULT_EXCHANGE_RATES[from]?.[to];
  if (rate == null) return amount;
  return Math.round(amount * rate * 1000) / 1000;
}

export function parseCurrency(value: string): number {
  const cleaned = value
    .replace(/[₪$]/g, "")
    .replace(/د\.أ/g, "")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\d.]/g, "");
  return parseFloat(cleaned) || 0;
}

export function useCurrency(currency: CurrencyCode = "ILS") {
  return {
    format: (amount: number) => formatCurrency(amount, currency),
    convert: (amount: number, to: CurrencyCode) => convertCurrency(amount, currency, to),
    parse: parseCurrency,
  };
}
