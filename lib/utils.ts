import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Приводит телефон к формату 77XXXXXXXXX (для tel: и wa.me). */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1)
  if (digits.length === 10) return '7' + digits
  return digits
}

export function slugify(value: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya', ә: 'a', ғ: 'g', қ: 'k', ң: 'n', ө: 'o', ұ: 'u', ү: 'u',
    һ: 'h', і: 'i',
  }
  return value
    .toLowerCase()
    .split('')
    .map((ch) => (ch in map ? map[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Мультиязычное поле с фолбэком на русский. */
export function pick(
  row: Record<string, unknown> | null | undefined,
  field: string,
  locale: string,
): string {
  if (!row) return ''
  const localized = row[`${field}_${locale === 'kk' ? 'kk' : 'ru'}`]
  if (typeof localized === 'string' && localized.trim()) return localized
  const fallback = row[`${field}_ru`]
  return typeof fallback === 'string' ? fallback : ''
}

export function formatMoney(value: number | null | undefined, locale = 'ru'): string {
  if (value === null || value === undefined) return '—'
  if (value === 0) return locale === 'kk' ? 'Тегін' : 'Бесплатно'
  return new Intl.NumberFormat(locale === 'kk' ? 'kk-KZ' : 'ru-KZ').format(value) + ' ₸'
}

export function formatDate(value: string | Date | null | undefined, locale = 'ru'): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-KZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string | Date | null | undefined, locale = 'ru'): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-KZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—'
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 3)}***@${domain}`
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
}
