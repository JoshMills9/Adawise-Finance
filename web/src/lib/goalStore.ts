// Demo stores: seeded with dummy data, remember what's created or changed in the demo.
import { useSyncExternalStore } from 'react'
import {
  CIRCLES,
  GOALS,
  NOTICES,
  REQUESTS,
  SAVE_ME,
  SUPPORTING,
  type Activity,
  type Circle,
  type Goal,
  type Notice,
  type Partner,
  type PartnerRequest,
  type SupportedGoal,
} from "./demoData"
import { iso, todayIso, uid } from './format'

function createStore<T>(key: string, seed: T, migrate?: (raw: unknown) => T) {
  const listeners = new Set<() => void>()
  let value: T = seed
  try {
    const raw = localStorage.getItem(key)
    if (raw) value = migrate ? migrate(JSON.parse(raw)) : (JSON.parse(raw) as T)
  } catch {
    /* storage unavailable or bad data: use the seed */
  }
  const notify = () => listeners.forEach((l) => l())
  const subscribe = (l: () => void) => {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }
  return {
    get: () => value,
    set(next: T) {
      value = next
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* not persisted, still works for this session */
      }
      notify()
    },
    reset() {
      try {
        localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
      value = seed
      notify()
    },
    useValue: () => useSyncExternalStore(subscribe, () => value),
  }
}

/* ---------- goals ---------- */

// Older demo data stored a single `partner` and no `createdAt`; bring it up to date
const migrateGoals = (raw: unknown) =>
  (raw as (Goal & { partner?: Partner })[]).map(({ partner, ...g }) => ({
    ...g,
    createdAt: g.createdAt ?? todayIso(),
    partners: g.partners ?? (partner ? [partner] : undefined),
  }))

const goals = createStore<Goal[]>('adawise.goals.v2', GOALS, migrateGoals)

export const goalStore = {
  add: (g: Goal) => goals.set([g, ...goals.get()]),
  update: (id: string, fn: (g: Goal) => Goal) => goals.set(goals.get().map((g) => (g.id === id ? fn(g) : g))),
  /** Moves money in (+) or out (−) of a goal and logs it */
  record(id: string, kind: Activity['kind'], amount: number, delta: number, note?: string) {
    goalStore.update(id, (g) => ({
      ...g,
      saved: Math.max(0, g.saved + delta),
      activity: [{ id: uid('a'), kind, amount, date: todayIso(), note }, ...(g.activity ?? [])],
    }))
  },
  /** Pays a goal's next scheduled contribution and rolls the due date forward one period */
  payContribution(id: string) {
    const g = goals.get().find((x) => x.id === id)
    if (!g?.nextContribution) return
    const { amount, due } = g.nextContribution
    goalStore.record(id, 'deposit', amount, +amount, 'Scheduled saving')
    const next = new Date(due + 'T00:00:00')
    const f = g.plan?.frequency ?? 'weekly'
    if (f === 'monthly') next.setMonth(next.getMonth() + 1)
    else next.setDate(next.getDate() + (f === 'daily' ? 1 : 7))
    goalStore.update(id, (x) => ({ ...x, nextContribution: { amount, due: iso(next) } }))
  },
  reset: goals.reset,
}
export const useGoals = () => goals.useValue()
export const useGoal = (id: string | undefined) => useGoals().find((g) => g.id === id)

/* ---------- circles ---------- */

const circles = createStore<Circle[]>('adawise.circles.v2', CIRCLES)

export const circleStore = {
  add: (c: Circle) => circles.set([c, ...circles.get()]),
  update: (id: string, fn: (c: Circle) => Circle) => circles.set(circles.get().map((c) => (c.id === id ? fn(c) : c))),
  log: (id: string, text: string) =>
    circleStore.update(id, (c) => ({ ...c, activity: [{ id: uid('c'), text, date: todayIso() }, ...c.activity] })),
  reset: circles.reset,
}
export const useCircles = () => circles.useValue()
export const useCircle = (id: string | undefined) => useCircles().find((c) => c.id === id)

/* ---------- Save Me allowance (3 successful rescues per calendar year) ---------- */

const saveMe = createStore('adawise.saveMe', { used: SAVE_ME.used, year: new Date().getFullYear() })

export const saveMeStore = {
  use: () => {
    const s = saveMe.get()
    const year = new Date().getFullYear()
    saveMe.set({ used: (s.year === year ? s.used : 0) + 1, year })
  },
  reset: saveMe.reset,
}
export function useSaveMe() {
  const s = saveMe.useValue()
  const used = s.year === new Date().getFullYear() ? s.used : 0 // resets every 1 January
  return { used, allowed: SAVE_ME.allowed, left: Math.max(0, SAVE_ME.allowed - used) }
}

/* ---------- notifications ---------- */

const notices = createStore<Notice[]>('adawise.notices.v2', NOTICES)

export const noticeStore = {
  push: (n: Omit<Notice, 'id' | 'date' | 'read'>) => notices.set([{ ...n, id: uid('n'), date: todayIso(), read: false }, ...notices.get()]),
  markAllRead: () => notices.set(notices.get().map((n) => (n.read ? n : { ...n, read: true }))),
  reset: notices.reset,
}
export const useNotices = () => notices.useValue()
export const useUnreadCount = () => useNotices().filter((n) => !n.read).length

/* ---------- requests sent to you (invites + Save Me) ---------- */

const requests = createStore<PartnerRequest[]>('adawise.requests.v2', REQUESTS)

export const requestStore = {
  update: (id: string, patch: Partial<PartnerRequest>) =>
    requests.set(requests.get().map((r) => (r.id === id ? ({ ...r, ...patch } as PartnerRequest) : r))),
  reset: requests.reset,
}
export const useRequests = () => requests.useValue()
export const useRequest = (id: string | undefined) => useRequests().find((r) => r.id === id)

/* ---------- goals you support ---------- */

const supporting = createStore<SupportedGoal[]>('adawise.supporting.v2', SUPPORTING)

export const supportStore = {
  add: (s: SupportedGoal) => supporting.set([s, ...supporting.get().filter((x) => x.id !== s.id)]),
  update: (id: string, fn: (s: SupportedGoal) => SupportedGoal) => supporting.set(supporting.get().map((s) => (s.id === id ? fn(s) : s))),
  reset: supporting.reset,
}
export const useSupporting = () => supporting.useValue()

/* ---------- your partner profile (Save Me PIN) ---------- */

// Demo only: the PIN itself is never stored, just a salted fingerprint of it.
// A real app would verify the PIN on the Adawise backend.
function fingerprint(pin: string) {
  let h = 0x811c9dc5
  for (const ch of `adawise-save-me:${pin}`) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0
  return h.toString(16)
}

const profile = createStore<{ pinPrint: string | null }>('adawise.partnerProfile', { pinPrint: null })

export const partnerProfile = {
  setPin: (pin: string) => profile.set({ pinPrint: fingerprint(pin) }),
  checkPin: (pin: string) => profile.get().pinPrint === fingerprint(pin),
  reset: profile.reset,
}
export const useHasSaveMePin = () => profile.useValue().pinPrint !== null

/** Clears everything created during a demo (used by ?reset) */
export function resetAdawise() {
  goalStore.reset()
  circleStore.reset()
  saveMeStore.reset()
  noticeStore.reset()
  requestStore.reset()
  supportStore.reset()
  partnerProfile.reset()
}

