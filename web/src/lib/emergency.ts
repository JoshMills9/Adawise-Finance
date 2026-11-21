// Emergency protection (demo): a safety slice of each contribution fills one emergency pocket per user,
// and each goal allows one emergency withdrawal after a 24-hour cooling-off.
//
// How the demo maps onto today's API (no pocket endpoints exist yet):
// - The pocket is real money held in the Adawise wallet, ring-fenced here on the device.
//   A sliced contribution is one MoMo payment into the wallet, then an instant allocation of the
//   goal's share; the slice stays in the wallet as pocket money.
// - Pocket withdrawals are real wallet withdrawals.
// - The goal part of an emergency withdrawal can't move yet: the server enforces lock rules.
//   The flow runs end to end and says so at the end.
import { api, auth, toMoney } from './api'
import { contributeToGoal, depositToWallet, refreshGoal, refreshWallet, withdrawFromWallet } from './adawise'
import type { Frequency } from './demoData'
import { createStore, useWallet } from './goalStore'

export const EMERGENCY = {
  /** Pocket limit until the user picks their own; after it, 100% goes to goals */
  defaultCap: 500,
  capOptions: [500, 1000, 1500, 2000] as const,
  minCap: 500,
  slices: [5, 10, 20] as const,
  defaultSlice: 10,
  coolingHours: 24,
}

export type Emergency = {
  goalId: string
  /** From the goal (on top of what the pocket covered) */
  amount: number
  fromPocket: number
  declaredAt: number
  readyAt: number
  status: 'cooling' | 'released' | 'cancelled'
  tellPartners: boolean
  /** Optional plan to rebuild what was taken: extra per period, for N periods */
  topUp?: { extra: number; periods: number }
}

type State = {
  /** Pocket money (a ring-fenced part of the wallet balance) */
  pocket: number
  /** The user's own pocket limit (absent = the default) */
  cap?: number
  /** Safety slice per goal, in percent (absent or 0 = off) */
  slices: Record<string, number>
  /** One emergency per goal, ever (cancelled ones don't count) */
  emergencies: Record<string, Emergency>
}
const EMPTY: State = { pocket: 0, slices: {}, emergencies: {} }

const store = createStore<Record<string, State>>('adawise.emergency', {})
const owner = () => auth.user()?.user_id ?? 'guest'
const mine = () => store.get()[owner()] ?? EMPTY
const save = (patch: Partial<State>) => store.set({ ...store.get(), [owner()]: { ...mine(), ...patch } })

/* ---------- reads ---------- */

export const useEmergencyState = () => store.useValue()[owner()] ?? EMPTY
// A limit saved before the minimum went up is lifted to it
export const capOf = (s: State) => Math.max(EMERGENCY.minCap, s.cap ?? EMERGENCY.defaultCap)

/** The pocket can never be more than the wallet actually holds */
export function usePocket() {
  const s = useEmergencyState()
  const wallet = useWallet()
  const balance = Math.min(s.pocket, wallet.balance)
  const cap = capOf(s)
  return { balance, cap, full: balance >= cap, room: Math.max(0, cap - balance) }
}

export const sliceOf = (s: State, goalId: string) => s.slices[goalId] ?? 0

/** How much of a contribution goes to the pocket (none once it's full) */
export function splitContribution(goalId: string, amount: number) {
  const s = mine()
  const pct = sliceOf(s, goalId)
  const pocket = Math.max(0, Math.min(Math.round(amount * pct) / 100, capOf(s) - s.pocket))
  const toPocket = Math.round(pocket * 100) / 100
  return { toPocket, toGoal: Math.round((amount - toPocket) * 100) / 100 }
}

/* ---------- writes ---------- */

export const setSlice = (goalId: string, pct: number) => save({ slices: { ...mine().slices, [goalId]: pct } })
/** The user's pocket limit. Lowering it below the balance takes nothing out; the pocket just stops growing. */
export const setPocketCap = (cap: number) => save({ cap: Math.max(EMERGENCY.minCap, Math.round(cap)) })

/** One MoMo payment; the safety slice (if any) stays in the wallet as pocket money */
export async function contributeWithSlice(goalId: string, amount: number) {
  // A retry after the MoMo part already went through only redoes the allocation (never charges twice)
  const pending = unallocated?.goalId === goalId && unallocated.amount === amount ? unallocated : null
  const { toPocket, toGoal } = pending ?? splitContribution(goalId, amount)
  if (!pending && toPocket <= 0) return contributeToGoal(goalId, amount)
  if (!pending) {
    await depositToWallet(amount)
    save({ pocket: mine().pocket + toPocket })
    unallocated = { goalId, amount, toPocket, toGoal }
  }
  try {
    await api.post('/wallet/allocations/', { goal_id: goalId, amount: toMoney(toGoal) }, { idempotent: true })
  } catch (e) {
    await refreshWallet().catch(() => undefined)
    throw new Error(`Your ${toMoney(amount)} reached your Adawise wallet, but moving it to the goal didn't work. Try again to finish (you won't be charged again).`, { cause: e })
  }
  unallocated = null
  await Promise.all([refreshGoal(goalId), refreshWallet()])
  return { toPocket, toGoal }
}
let unallocated: { goalId: string; amount: number; toPocket: number; toGoal: number } | null = null

/** Pocket → MoMo (a real wallet withdrawal) */
export async function withdrawFromPocket(amount: number) {
  await withdrawFromWallet(amount)
  save({ pocket: Math.max(0, mine().pocket - amount) })
}

export function declareEmergency(e: Omit<Emergency, 'declaredAt' | 'readyAt' | 'status'>) {
  const now = Date.now()
  const em: Emergency = { ...e, declaredAt: now, readyAt: now + EMERGENCY.coolingHours * 3_600_000, status: 'cooling' }
  save({ emergencies: { ...mine().emergencies, [e.goalId]: em } })
  return em
}

const patchEmergency = (goalId: string, patch: Partial<Emergency>) => {
  const em = mine().emergencies[goalId]
  if (em) save({ emergencies: { ...mine().emergencies, [goalId]: { ...em, ...patch } } })
}

/** Demo only: jump to the end of the cooling-off */
export const skipCoolingOff = (goalId: string) => patchEmergency(goalId, { readyAt: Date.now() })
export const cancelEmergency = (goalId: string) => patchEmergency(goalId, { status: 'cancelled' })
/** Demo only: the goal part isn't paid out (the API keeps locked goals locked) */
export const releaseEmergency = async (goalId: string) => {
  await new Promise((r) => setTimeout(r, 1500))
  patchEmergency(goalId, { status: 'released' })
}

export const resetEmergency = () => store.reset()

/* ---------- plan maths ---------- */

const periodsIn = (months: number, f: Frequency) => (f === 'daily' ? months * 30 : f === 'weekly' ? Math.round((months * 52) / 12) : months)

export function addPeriods(n: number, f: Frequency, from = new Date()) {
  const d = new Date(from)
  if (f === 'daily') d.setDate(d.getDate() + n)
  else if (f === 'weekly') d.setDate(d.getDate() + 7 * n)
  else d.setMonth(d.getMonth() + n)
  return d
}

/**
 * What a safety slice costs this goal. Cautious: assumes only this goal fills the pocket
 * (other goals filling it too would make the delay shorter).
 */
export function sliceTradeOff({ target, perPeriod, months, frequency, pct, pocketNow, cap }: { target: number; perPeriod: number; months: number; frequency: Frequency; pct: number; pocketNow: number; cap: number }) {
  const planned = periodsIn(months, frequency)
  let pocket = pocketNow
  let saved = 0
  let n = 0
  let atPlannedEnd = 0
  while (saved < target && n < planned * 4) {
    n++
    const slice = Math.max(0, Math.min((perPeriod * pct) / 100, cap - pocket))
    pocket += slice
    saved += perPeriod - slice
    if (n === planned) atPlannedEnd = saved
  }
  const base = Math.ceil(target / perPeriod)
  return {
    baseDate: addPeriods(base, frequency),
    sliceDate: addPeriods(n, frequency),
    extraPeriods: Math.max(0, n - base),
    /** Into the pocket over the plan (for the "your pocket gets …" line) */
    toPocket: Math.max(0, pocket - pocketNow),
    /** Time-locked goals unlock on their date regardless: how short they'd be then */
    shortAtEnd: Math.max(0, Math.round(target - (n <= planned ? target : atPlannedEnd))),
  }
}
