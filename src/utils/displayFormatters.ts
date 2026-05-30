import { CURRENCIES, type CurrencyCode } from "../config/palestineConfig";

export const DISPLAY_NUMBER_LOCALE = "en-US";
export const DISPLAY_DATE_LOCALE = "en-US";
export const DISPLAY_NUMBERING_SYSTEM = "latn";

type NumberFormatOverrides = Omit<Intl.NumberFormatOptions, "numberingSystem">;
type DateFormatOverrides = Omit<Intl.DateTimeFormatOptions, "numberingSystem">;

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function numberFormatter(options: NumberFormatOverrides = {}) {
  return new Intl.NumberFormat(DISPLAY_NUMBER_LOCALE, {
    numberingSystem: DISPLAY_NUMBERING_SYSTEM,
    ...options,
  });
}

export function formatNumberValue(
  value: number,
  options: NumberFormatOverrides = {},
) {
  return numberFormatter(options).format(safeNumber(value));
}

export function formatIntegerValue(value: number) {
  return formatNumberValue(value, {
    maximumFractionDigits: 0,
  });
}

export function formatCompactNumberValue(
  value: number,
  options: NumberFormatOverrides = {},
) {
  return formatNumberValue(value, {
    notation: "compact",
    maximumFractionDigits: 1,
    ...options,
  });
}

export function formatPercentValue(
  value: number,
  options: NumberFormatOverrides = {},
) {
  return `${formatNumberValue(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options,
  })}%`;
}

export function formatCurrencyValue(
  value: number,
  currency: CurrencyCode = "ILS",
  options: NumberFormatOverrides = {},
) {
  const currencyMeta = CURRENCIES.find((item) => item.code === currency);
  const decimals = currencyMeta?.decimals ?? 2;
  const absoluteValue = Math.abs(safeNumber(value));
  const sign = value < 0 ? "-" : "";
  const symbol = currencyMeta?.symbol ?? currency;

  const formattedNumber = formatNumberValue(absoluteValue, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...options,
  });

  return `${sign}${symbol} ${formattedNumber}`;
}

export function formatDateValue(
  value: string | number | Date,
  options: DateFormatOverrides = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
  locale = DISPLAY_DATE_LOCALE,
) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(locale, {
    numberingSystem: DISPLAY_NUMBERING_SYSTEM,
    ...options,
  }).format(parsed);
}

export function formatTimeValue(
  value: string | number | Date,
  options: DateFormatOverrides = {
    hour: "2-digit",
    minute: "2-digit",
  },
  locale = DISPLAY_DATE_LOCALE,
) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(locale, {
    numberingSystem: DISPLAY_NUMBERING_SYSTEM,
    ...options,
  }).format(parsed);
}
