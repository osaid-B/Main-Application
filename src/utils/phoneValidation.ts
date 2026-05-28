export type PhoneValidationResult = {
  valid: boolean
  formatted: string
  error?: string
}

const RULES = [
  { prefix: '059', length: 10, format: (d: string) => `059-${d.slice(3,6)}-${d.slice(6)}` },
  { prefix: '056', length: 10, format: (d: string) => `056-${d.slice(3,6)}-${d.slice(6)}` },
  { prefix: '09',  length: 9,  format: (d: string) => `09-${d.slice(2,5)}-${d.slice(5)}`  },
]

export function validatePhone(raw: string): PhoneValidationResult {
  const digits = raw.replace(/[\s\-.]/g, '')

  if (!digits) {
    return { valid: false, formatted: '', error: 'رقم الهاتف مطلوب' }
  }

  if (!/^\d+$/.test(digits)) {
    return { valid: false, formatted: digits, error: 'أرقام فقط بدون حروف أو رموز' }
  }

  const rule = RULES.find(r => digits.startsWith(r.prefix))

  if (!rule) {
    return {
      valid: false,
      formatted: digits,
      error: 'المقدمة غير صحيحة — المقدمات المسموحة: 059 أو 056 أو 09'
    }
  }

  if (digits.length < rule.length) {
    return {
      valid: false,
      formatted: digits,
      error: `الرقم يجب أن يكون ${rule.length} أرقام (أدخلت ${digits.length})`
    }
  }

  if (digits.length > rule.length) {
    return {
      valid: false,
      formatted: digits,
      error: `الرقم يجب أن يكون ${rule.length} أرقام فقط`
    }
  }

  return { valid: true, formatted: rule.format(digits) }
}

// Strip to digits only while typing — max 10 chars
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d]/g, '').slice(0, 10)
}
