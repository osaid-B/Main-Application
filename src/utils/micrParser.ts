import { PALESTINIAN_BANKS } from '../types/treasury';

export interface MicrParseResult {
  raw: string;
  bankCode?: string;
  branchCode?: string;
  accountNumber?: string;
  checkNumber?: string;
  bank?: typeof PALESTINIAN_BANKS[number];
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

// Palestinian MICR: ⑆[BankCode 3][BranchCode 3]⑆ [Account 10-13] ⑉ [Check# 6] ⑈
const MICR_TRANSIT    = '⑆';
const MICR_ON_US      = '⑉';
// const MICR_AMOUNT  = '⑈';  // not needed for parsing

export function parseMicrLine(raw: string): MicrParseResult {
  const warnings: string[] = [];

  // Normalize: remove spaces and extra whitespace around MICR chars
  const normalized = raw.trim();

  // Pattern 1: full MICR with special chars
  // ⑆031500⑆ 1234567890 ⑉ 000125 ⑈
  const fullPattern = new RegExp(
    `[${MICR_TRANSIT}](\\d{3})(\\d{3})[${MICR_TRANSIT}]\\s*(\\d{10,13})\\s*[${MICR_ON_US}]\\s*(\\d{6})`
  );

  const match = normalized.match(fullPattern);

  if (match) {
    const [, bankCode, branchCode, accountNumber, checkNumber] = match;
    const bank = PALESTINIAN_BANKS.find(b => b.code === bankCode);
    if (!bank) warnings.push('كود البنك غير معروف — تحقق يدوياً');
    return {
      raw,
      bankCode,
      branchCode,
      accountNumber,
      checkNumber,
      bank,
      confidence: bank ? 'high' : 'medium',
      warnings,
    };
  }

  // Pattern 2: digits only (manual entry or OCR without MICR chars)
  // 031 500 1234567890 000125
  const digitsOnly = normalized.replace(/[^0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = digitsOnly.split(' ').filter(p => p.length > 0);

  // Try to reconstruct: first 3 = bank, next 3 = branch, then account (10-13), then check (6)
  if (parts.length >= 4) {
    const bankCode   = parts[0].padStart(3, '0').slice(0, 3);
    const branchCode = parts[1].padStart(3, '0').slice(0, 3);
    const accountNumber = parts[2];
    const checkNumber   = parts[3].padStart(6, '0').slice(0, 6);

    if (accountNumber.length >= 10 && accountNumber.length <= 13) {
      const bank = PALESTINIAN_BANKS.find(b => b.code === bankCode);
      if (!bank) warnings.push('كود البنك غير معروف — تحقق يدوياً');
      warnings.push('تم استخراج البيانات بدون رموز MICR — دقة متوسطة');
      return {
        raw,
        bankCode,
        branchCode,
        accountNumber,
        checkNumber,
        bank,
        confidence: 'medium',
        warnings,
      };
    }
  }

  // Pattern 3: single run of digits (no separators at all)
  const allDigits = normalized.replace(/\D/g, '');
  if (allDigits.length >= 22) {
    const bankCode      = allDigits.slice(0, 3);
    const branchCode    = allDigits.slice(3, 6);
    // account is variable length (10-13); try 12-digit account first
    const accountNumber = allDigits.slice(6, 18);
    const checkNumber   = allDigits.slice(18, 24);
    const bank = PALESTINIAN_BANKS.find(b => b.code === bankCode);
    if (!bank) warnings.push('كود البنك غير معروف — تحقق يدوياً');
    warnings.push('جودة القراءة منخفضة — يجب التحقق من جميع الحقول');
    return {
      raw,
      bankCode,
      branchCode,
      accountNumber,
      checkNumber,
      bank,
      confidence: 'low',
      warnings,
    };
  }

  warnings.push('تعذّر تحليل سطر MICR — أدخل البيانات يدوياً');
  return { raw, confidence: 'low', warnings };
}

export function formatMicrLine(bankCode: string, branchCode: string, accountNumber: string, checkNumber: string): string {
  return `${MICR_TRANSIT}${bankCode}${branchCode}${MICR_TRANSIT} ${accountNumber} ${MICR_ON_US} ${checkNumber} ⑈`;
}

// Demo OCR result for UI preview (simulates scanning a real check)
export const DEMO_MICR_SCAN = '⑆015003⑆ 0012345678901 ⑉ 000742 ⑈';
