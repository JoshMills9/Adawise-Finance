// App stores. Goals, wallet, circles, notifications, Save Me, badges and profile are filled from
// the Adawise API (lib/adawise.ts) and cached; the partner side and loans are still demo data.
import { useSyncExternalStore } from 'react'
import {
  computeBadges,
  creditLeft,
  REQUESTS,
  SAVE_ME,
  SHOW_PARTNER_SIDE,
  SUPPORTING,
  type Activity,
  type Circle,
  type Goal,
  type Notice,
  type PartnerRequest,
  type SupportedGoal,
} from "./demoData"
import { iso, todayIso, uid } from './format'
import { auth } from './api'

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

// Filled from the Adawise API (see lib/adawise.ts); cached so screens render instantly on reopen
const goals = createStore<Goal[]>('adawise.api.goals', [])

export const goalStore = {
  all: () => goals.get(),
  replaceAll: (list: Goal[]) => goals.set(list),
  upsert: (g: Goal) => goals.set(goals.get().some((x) => x.id === g.id) ? goals.get().map((x) => (x.id === g.id ? g : x)) : [g, ...goals.get()]),
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
  /** Pays part or all of a goal's Save Me credit. Returns true once it's fully repaid. */
  repayCredit(id: string, amount: number, from: 'momo' | 'wallet'): boolean {
    const g = goals.get().find((x) => x.id === id)
    if (!g?.credit) return false
    const repaid = Math.round(((g.credit.repaid ?? 0) + amount) * 100) / 100
    const cleared = creditLeft({ ...g.credit, repaid }) <= 0
    goalStore.update(id, (x) => ({
      ...x,
      credit: cleared ? undefined : { ...x.credit!, repaid },
      activity: [
        { id: uid('a'), kind: 'repayment', amount, date: todayIso(), note: cleared ? 'Loan fully repaid' : from === 'wallet' ? 'From Adawise wallet' : 'From MoMo wallet' },
        ...(x.activity ?? []),
      ],
    }))
    if (from === 'wallet') walletStore.spendOnRepayment(amount, id, `Loan repayment · ${g.name}`)
    return cleared
  },
  reset: goals.reset,
}
export const useGoals = () => goals.useValue()
export const useGoal = (id: string | undefined) => useGoals().find((g) => g.id === id)

/* ---------- Adawise wallet (cash that isn't in a goal: deposits from MoMo, Save Me loans) ---------- */

export type WalletEntry = {
  id: string
  kind: 'deposit' | 'credit' | 'withdrawal' | 'repayment' | 'rescue' | 'interest'
  amount: number
  date: string
  note?: string
  goalId?: string
  /** Deposits: paid from MoMo or moved from Available */
  source?: 'momo' | 'wallet'
  /** Withdrawals: sent to MoMo or moved to Available */
  to?: 'momo' | 'wallet'
}
/** Home totals as the API reports them (total includes the wallet) */
export type WalletSummary = { total: number; locked: number; available: number }
type WalletState = { balance: number; activity: WalletEntry[]; summary?: WalletSummary }
const wallet = createStore<WalletState>('adawise.api.wallet', { balance: 0, activity: [] })

export const walletStore = {
  replace: (w: WalletState) => wallet.set(w),
  /** Deposit from the MoMo wallet */
  deposit(amount: number) {
    const w = wallet.get()
    wallet.set({ balance: w.balance + amount, activity: [{ id: uid('w'), kind: 'deposit', amount, date: todayIso(), note: 'From MoMo wallet' }, ...w.activity] })
  },
  /** Save Me credit granted against a goal's fixed deposit lands here */
  addCredit(amount: number, goalId: string, note: string) {
    const w = wallet.get()
    wallet.set({ balance: w.balance + amount, activity: [{ id: uid('w'), kind: 'credit', amount, date: todayIso(), note, goalId }, ...w.activity] })
  },
  /** Cash out to the MoMo wallet */
  withdraw(amount: number) {
    const w = wallet.get()
    wallet.set({ balance: Math.max(0, w.balance - amount), activity: [{ id: uid('w'), kind: 'withdrawal', amount, date: todayIso(), note: 'To MoMo wallet' }, ...w.activity] })
  },
  /** Pays a credit back from the credit balance still sitting in the wallet */
  spendOnRepayment(amount: number, goalId: string, note: string) {
    const w = wallet.get()
    wallet.set({ balance: Math.max(0, w.balance - amount), activity: [{ id: uid('w'), kind: 'repayment', amount, date: todayIso(), note, goalId }, ...w.activity] })
  },
  reset: wallet.reset,
}
export const useWallet = () => wallet.useValue()

/* ---------- circles ---------- */

const circles = createStore<Circle[]>('adawise.api.circles', [])

export const circleStore = {
  all: () => circles.get(),
  replaceAll: (list: Circle[]) => circles.set(list),
  upsert: (c: Circle) => circles.set(circles.get().some((x) => x.id === c.id) ? circles.get().map((x) => (x.id === c.id ? c : x)) : [c, ...circles.get()]),
  add: (c: Circle) => circles.set([c, ...circles.get()]),
  update: (id: string, fn: (c: Circle) => Circle) => circles.set(circles.get().map((c) => (c.id === id ? fn(c) : c))),
  log: (id: string, text: string) =>
    circleStore.update(id, (c) => ({ ...c, activity: [{ id: uid('c'), text, date: todayIso() }, ...c.activity] })),
  reset: circles.reset,
}
export const useCircles = () => circles.useValue()
export const useCircle = (id: string | undefined) => useCircles().find((c) => c.id === id)

/* ---------- Save Me allowance (3 successful rescues per calendar year) ---------- */

const saveMe = createStore('adawise.api.saveMe', { used: 0, year: new Date().getFullYear(), allowed: SAVE_ME.allowed })

export const saveMeStore = {
  /** Yearly usage as the API reports it */
  replace: (used: number, allowed: number) => saveMe.set({ used, allowed, year: new Date().getFullYear() }),
  use: () => {
    const s = saveMe.get()
    const year = new Date().getFullYear()
    saveMe.set({ ...s, used: (s.year === year ? s.used : 0) + 1, year })
  },
  reset: saveMe.reset,
}
export function useSaveMe() {
  const s = saveMe.useValue()
  const used = s.year === new Date().getFullYear() ? s.used : 0 // resets every 1 January
  const allowed = s.allowed ?? SAVE_ME.allowed
  return { used, allowed, left: Math.max(0, allowed - used) }
}

/* ---------- notifications ---------- */

const notices = createStore<Notice[]>('adawise.api.notices', [])

export const noticeStore = {
  replaceAll: (list: Notice[]) => notices.set(list),
  push: (n: Omit<Notice, 'id' | 'date' | 'read'>) => notices.set([{ ...n, id: uid('n'), date: todayIso(), read: false }, ...notices.get()]),
  markAllRead: () => notices.set(notices.get().map((n) => (n.read ? n : { ...n, read: true }))),
  reset: notices.reset,
}
// While the partner side is hidden, drop notifications that would open request screens
const visible = (n: Notice) => SHOW_PARTNER_SIDE || !n.link?.startsWith('/adawise/requests')
export const useNotices = () => notices.useValue().filter(visible)
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

/* ---------- WiseBadges and profile (from the API) ---------- */

export type ApiBadge = { months: number; earned: boolean; earnedOn?: string; now: number }
const apiBadges = createStore<ApiBadge[] | null>('adawise.api.badges', null)
export const badgeStore = { replace: (b: ApiBadge[]) => apiBadges.set(b), reset: apiBadges.reset }

export type Profile = { name: string; phone: string; totalSaved: number; goals: number; circles: number; loanOwed: number }
const profileApi = createStore<Profile | null>('adawise.api.profile', null)
export const profileStore = { replace: (p: Profile) => profileApi.set(p), reset: profileApi.reset }
export const useProfile = () => profileApi.useValue()

/** Ends the Adawise session and drops its cached data (MoMo log out) */
export function signOutAdawise() {
  auth.clear()
  goalStore.reset()
  walletStore.reset()
  circleStore.reset()
  noticeStore.reset()
  saveMeStore.reset()
  badgeStore.reset()
  profileStore.reset()
}

/** Clears everything created during a demo (used by ?reset) */
export function resetAdawise() {
  signOutAdawise()
  goalStore.reset()
  walletStore.reset()
  circleStore.reset()
  saveMeStore.reset()
  noticeStore.reset()
  requestStore.reset()
  supportStore.reset()
  partnerProfile.reset()
}


/** WiseBadges, worked out live from goals, circles and partner activity */
export function useBadges() {
  const goals = useGoals()
  const circles = useCircles()
  const supporting = useSupporting()
  const requests = useRequests()
  const api = apiBadges.useValue()
  const all = computeBadges({ goals, circles, supporting, requests })
  if (!api) return all
  // Saver badges come from the API; which goals reached each milestone is still worked out here
  return all.map((b) => {
    const a = b.group === 'saver' ? api.find((x) => `milestone-${x.months}` === b.id) : undefined
    return a ? { ...b, earned: a.earned, earnedOn: a.earnedOn ?? b.earnedOn, progress: { ...b.progress, now: a.now } } : b
  })
}
