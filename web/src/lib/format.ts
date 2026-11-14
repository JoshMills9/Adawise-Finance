// Small formatting and maths helpers shared by the Adawise screens.
import type { Frequency } from './demoData'

export const PERIODS = [3, 6, 9, 12]
export const FREQUENCIES: { id: Frequency; label: string; per: string }[] = [
  { id: 'daily', label: 'Daily', per: 'day' },
  { id: 'weekly', label: 'Weekly', per: 'week' },
  { id: 'monthly', label: 'Monthly', per: 'month' },
]
export const perLabel = (f: Frequency) => FREQUENCIES.find((x) => x.id === f)!.per

export const amountOf = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0
export const cleanAmount = (s: string) => s.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 9)

export function addMonths(months: number, from: Date | string = new Date()) {
  const d = typeof from === 'string' ? new Date(from + 'T00:00:00') : new Date(from)
  d.setMonth(d.getMonth() + months)
  return d
}

export const longDate = (d: Date | string) =>
  (typeof d === 'string' ? new Date(d + 'T00:00:00') : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const iso = (d: Date) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}
export const todayIso = () => iso(new Date())

/** Amount per saving period needed to reach `target` in `months` */
export function contribution(target: number, months: number, f: Frequency) {
  const periods = f === 'daily' ? months * 30 : f === 'weekly' ? Math.round((months * 52) / 12) : months
  return Math.max(1, Math.ceil(target / periods))
}

export function nextDue(f: Frequency) {
  const d = new Date()
  d.setDate(d.getDate() + (f === 'daily' ? 1 : f === 'weekly' ? 7 : 30))
  return iso(d)
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || 'P'

export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/** "024 412 3456" / "24 412 3456" / "233244123456" → "+233244123456" */
export function toE164(phone: string) {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('233') ? `+${d}` : `+233${d.replace(/^0/, '')}`
}

/** True for a full Ghana mobile number (9 digits after +233 or the leading 0) */
export const isPhone = (phone: string) => /^\+233\d{9}$/.test(toE164(phone))

/** "+233244123456" → "024 412 3456", the way people write it */
export function localPhone(phone: string) {
  const d = toE164(phone).slice(4)
  return d.length === 9 ? `0${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : phone
}
