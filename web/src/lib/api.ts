// Adawise backend client: base URL, token auth, error envelope, idempotency keys and payment polling.
// The MoMo screens stay simulated; only the Adawise section talks to this API.

// Same origin by default (/api/v1 is proxied to the backend by Vite and Vercel). VITE_API_URL can
// point straight at a backend that allows CORS; a trailing /api/v1 is accepted.
const BASE = String(import.meta.env.VITE_API_URL ?? '')
  .replace(/\/+$/, '')
  .replace(/\/api\/v1$/, '')

const TOKEN_KEY = 'adawise.api.token'
const USER_KEY = 'adawise.api.user'

export type ApiUser = { user_id: string; phone: string; name: string }

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable: the session lasts until reload */
  }
}

let memToken: string | null = read(TOKEN_KEY)

export const auth = {
  token: () => memToken,
  isSignedIn: () => !!memToken,
  user(): ApiUser | null {
    try {
      return JSON.parse(read(USER_KEY) ?? 'null') as ApiUser | null
    } catch {
      return null
    }
  },
  set(token: string, user: ApiUser) {
    memToken = token
    write(TOKEN_KEY, token)
    write(USER_KEY, JSON.stringify(user))
  },
  clear() {
    memToken = null
    write(TOKEN_KEY, null)
    write(USER_KEY, null)
  },
}

/** Fired when the backend rejects the token; the app sends the user back to the Adawise login */
export const UNAUTHORIZED_EVENT = 'adawise:unauthorized'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

/** UUID that also works on plain-http LAN URLs, where crypto.randomUUID is missing */
export function uuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6]! & 0x0f) | 0x40
  b[8] = (b[8]! & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** API money is a decimal string in cedis */
export const fromMoney = (s: string | number | null | undefined) => Number(s ?? 0) || 0
export const toMoney = (n: number) => (Math.round(n * 100) / 100).toFixed(2)

/** Best human-readable message from the error envelope, DRF field errors or `detail` */
function messageFrom(body: unknown, status: number): { message: string; code?: string; details?: unknown } {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    const env = b.error as { code?: string; message?: string; details?: unknown } | undefined
    if (env?.message) return { message: env.message, code: env.code, details: env.details }
    if (typeof b.detail === 'string') return { message: b.detail }
    for (const v of Object.values(b)) {
      if (typeof v === 'string') return { message: v, details: body }
      if (Array.isArray(v) && typeof v[0] === 'string') return { message: v[0], details: body }
    }
  }
  if (status === 0) return { message: "Can't reach Adawise. Check your connection and try again." }
  return { message: `Something went wrong (${status}). Please try again.` }
}

type Options = { query?: Record<string, string | number | boolean | undefined>; body?: unknown; idempotent?: boolean }

async function request<T>(method: string, path: string, { query, body, idempotent }: Options = {}): Promise<T> {
  const url = new URL(`${BASE}/api/v1${path}`, window.location.origin)
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v))

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (memToken) headers.Authorization = `Token ${memToken}`
  if (idempotent) headers['Idempotency-Key'] = uuid()

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(messageFrom(null, 0).message, 0, 'network')
  }

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    if (res.status === 401 && memToken) {
      auth.clear()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    const m = messageFrom(data, res.status)
    throw new ApiError(m.message, res.status, m.code, m.details)
  }
  return data as T
}

export const api = {
  get: <T>(path: string, query?: Options['query']) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown, opts: { idempotent?: boolean } = {}) => request<T>('POST', path, { body: body ?? {}, ...opts }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] }

/** Reads a list endpoint whether it returns a paginated envelope or a plain array (the spec has both) */
export async function list<T>(path: string, query: Options['query'] = {}, maxPages = 5): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; page <= maxPages; page++) {
    const data = await api.get<Page<T> | T[]>(path, { page_size: 100, ...query, page })
    if (Array.isArray(data)) return data
    out.push(...data.results)
    if (!data.next) break
  }
  return out
}

/* ---------- payments ---------- */

export type PaymentAttempt = {
  id: string
  direction: 'in' | 'out'
  amount: string
  purpose: string
  status: 'pending' | 'succeeded' | 'failed' | 'expired'
  goal_id: string | null
  created_at: string
  completed_at: string | null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Polls a pending MoMo payment until it settles (the sandbox can take ~2 minutes). Throws if it fails, expires or takes too long. */
export async function waitForPayment(attempt: PaymentAttempt, { timeoutMs = 240_000, everyMs = 2_500 } = {}) {
  let p = attempt
  const until = Date.now() + timeoutMs
  while (p.status === 'pending') {
    if (Date.now() > until) throw new ApiError('MoMo is taking longer than usual. Check your activity in a moment.', 408, 'payment_timeout')
    await sleep(everyMs)
    p = await api.get<PaymentAttempt>(`/payments/${p.id}/`)
  }
  if (p.status !== 'succeeded') {
    throw new ApiError(p.status === 'expired' ? 'The MoMo approval expired. Please try again.' : 'MoMo declined the payment. Please try again.', 402, `payment_${p.status}`)
  }
  return p
}
