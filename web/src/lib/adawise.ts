// Adawise backend ↔ app: maps API payloads into the app's own types (so screens don't change)
// and wraps the calls each screen makes. Results land in the stores in goalStore.ts.
import { api, ApiError, auth, fromMoney, list, toMoney, waitForPayment, type ApiUser, type PaymentAttempt } from './api'
import { CONTACTS, type Activity, type Circle, type Frequency, type Goal, type GoalType, type Notice, type Partner } from './demoData'
import { firstName, initials, iso } from './format'
import { badgeStore, circleStore, goalStore, noticeStore, profileStore, saveMeStore, walletStore, type WalletEntry } from './goalStore'

/* ---------- API shapes (only the fields the app reads) ---------- */

type ApiGoalType = 'flexible' | 'goal_locked' | 'time_locked'
type ApiSchedule = {
  amount_per_period: string
  frequency: Frequency
  term_months: number
  start_date: string
  next_due_date: string
  auto_save_enabled?: boolean
  reminders_enabled?: boolean
}
type ApiPartner = { id: string; first_name: string; initials: string; status: 'invited' | 'accepted' | 'declined' | 'removed'; relation: string }
export type ApiGoal = {
  id: string
  name: string
  icon: string
  type: ApiGoalType
  target: string
  balance: string
  status?: 'active' | 'completed' | 'closed'
  lock_state?: { locked: boolean; amount_to_go: string | null; unlocks_on: string | null; message: string } | null
  schedule?: ApiSchedule | null
  partners?: unknown[]
  circle_id?: string | null
  created_at: string
}
type ApiRecordKind =
  | 'topup'
  | 'allocation'
  | 'release'
  | 'withdrawal'
  | 'withdrawal_failed'
  | 'save_me_received'
  | 'interest'
  | 'milestone_interest'
  | 'loan_proceeds'
  | 'loan_repayment'
export type ApiRecord = {
  id: string
  kind: ApiRecordKind
  direction: 'credit' | 'debit'
  amount: string
  goal_id: string | null
  payment_attempt: string | null
  created_at: string
}

/* ---------- mapping ---------- */

const TYPE_IN: Record<ApiGoalType, GoalType> = { flexible: 'flexible', goal_locked: 'goal-locked', time_locked: 'time-locked' }
const TYPE_OUT: Record<GoalType, ApiGoalType> = { flexible: 'flexible', 'goal-locked': 'goal_locked', 'time-locked': 'time_locked' }

const day = (dateTime: string) => (dateTime.length <= 10 ? dateTime : iso(new Date(dateTime)))

function toPartners(raw: unknown[] | undefined): Partner[] | undefined {
  const ps = (raw ?? [])
    .map((p) => p as Partial<ApiPartner>)
    .filter((p) => p.status === 'invited' || p.status === 'accepted')
    .map<Partner>((p) => {
      // Someone not on Adawise yet comes back as their phone number; show the contact's name instead
      const contact = /^\+?\d{7,}$/.test(p.first_name ?? '') ? CONTACTS.find((c) => toE164(c.phone) === toE164(p.first_name!)) : undefined
      return {
      id: p.id,
      name: contact ? firstName(contact.name) : (p.first_name ?? 'Partner'),
      initials: contact ? initials(contact.name) : (p.initials ?? 'P'),
      // The API has no saver/supporter flag yet; `relation` is the closest hint
      role: /sav|circle/i.test(p.relation ?? '') ? 'saver' : 'supporter',
      status: p.status === 'accepted' ? 'active' : 'invited',
      }
    })
  return ps.length ? ps : undefined
}

export function toGoal(g: ApiGoal, prev?: Goal): Goal {
  const s = g.schedule
  return {
    id: g.id,
    name: g.name,
    icon: g.icon || 'target',
    type: TYPE_IN[g.type] ?? 'flexible',
    saved: fromMoney(g.balance),
    target: fromMoney(g.target),
    createdAt: day(g.created_at),
    // GoalRead has no end_date, so the unlock date comes from the lock state (or what we already knew)
    unlockDate: g.lock_state?.unlocks_on ? day(g.lock_state.unlocks_on) : prev?.unlockDate,
    partners: toPartners(g.partners),
    nextContribution: s ? { amount: fromMoney(s.amount_per_period), due: s.next_due_date } : undefined,
    plan: s
      ? {
          frequency: s.frequency,
          months: s.term_months,
          amount: fromMoney(s.amount_per_period),
          autoSave: s.auto_save_enabled ?? true,
          reminders: s.reminders_enabled ?? true,
        }
      : undefined,
    lock: g.lock_state ? { locked: g.lock_state.locked, message: g.lock_state.message } : undefined,
    // Not in GoalRead: kept from the last /activity fetch and the local loan demo
    activity: prev?.activity,
    credit: prev?.credit,
  }
}

const GOAL_KIND: Partial<Record<ApiRecordKind, Activity['kind']>> = {
  allocation: 'deposit',
  release: 'withdrawal',
  save_me_received: 'rescue',
  interest: 'interest',
  milestone_interest: 'interest',
  loan_proceeds: 'credit',
  loan_repayment: 'repayment',
}

/** A goal's own activity: money in and out of the goal (wallet-only records are skipped) */
export const toGoalActivity = (records: ApiRecord[]): Activity[] =>
  records.flatMap((r) => {
    const kind = GOAL_KIND[r.kind]
    return kind ? [{ id: r.id, kind, amount: fromMoney(r.amount), date: day(r.created_at) }] : []
  })

/** Two records belong to one money movement (top-up → allocation, release → withdrawal) */
function sameMove(a: ApiRecord, b: ApiRecord) {
  if (a.payment_attempt && a.payment_attempt === b.payment_attempt) return true
  return a.amount === b.amount && Math.abs(Date.parse(a.created_at) - Date.parse(b.created_at)) < 60_000
}

/**
 * Wallet transactions → the home feed. A MoMo payment into a goal is one allocation carrying the
 * payment (older ones may be top-up + allocation), and a goal withdrawal is release + withdrawal;
 * each movement shows once.
 */
export function toWalletFeed(records: ApiRecord[]): WalletEntry[] {
  const out: WalletEntry[] = []
  for (const r of records) {
    const amount = fromMoney(r.amount)
    const date = day(r.created_at)
    const pair = (kind: ApiRecordKind) => records.find((x) => x !== r && x.kind === kind && sameMove(r, x))
    switch (r.kind) {
      case 'topup':
        if (!pair('allocation')) out.push({ id: r.id, kind: 'deposit', amount, date, source: 'momo' })
        break
      case 'allocation':
        out.push({ id: r.id, kind: 'deposit', amount, date, goalId: r.goal_id ?? undefined, source: r.payment_attempt || pair('topup') ? 'momo' : 'wallet' })
        break
      case 'release': {
        // Paired with a withdrawal → shown there; on its own the money moved to Available
        if (!pair('withdrawal')) out.push({ id: r.id, kind: 'withdrawal', amount, date, goalId: r.goal_id ?? undefined, to: 'wallet' })
        break
      }
      case 'withdrawal': {
        const release = pair('release')
        out.push({ id: r.id, kind: 'withdrawal', amount, date, goalId: (r.goal_id ?? release?.goal_id) || undefined, to: 'momo' })
        break
      }
      case 'save_me_received':
        out.push({ id: r.id, kind: 'rescue', amount, date, goalId: r.goal_id ?? undefined })
        break
      case 'interest':
      case 'milestone_interest':
        out.push({ id: r.id, kind: 'interest', amount, date, goalId: r.goal_id ?? undefined })
        break
      case 'loan_proceeds':
        out.push({ id: r.id, kind: 'credit', amount, date, goalId: r.goal_id ?? undefined })
        break
      case 'loan_repayment':
        out.push({ id: r.id, kind: 'repayment', amount, date, goalId: r.goal_id ?? undefined })
        break
      // withdrawal_failed: the money is back in the wallet; the balance already shows it
    }
  }
  return out
}

/* ---------- auth ---------- */

type SessionResponse = { token: string; user_id: string; phone: string; name: string }

export async function signIn(phone: string, name: string): Promise<ApiUser> {
  const res = await api.post<SessionResponse>('/auth/session', { phone, name })
  const user = { user_id: res.user_id, phone: res.phone, name: res.name }
  auth.set(res.token, user)
  return user
}

/* ---------- reads ---------- */

export async function refreshGoals() {
  const rows = await list<ApiGoal>('/goals/')
  const prev = new Map(goalStore.all().map((g) => [g.id, g]))
  // A circle gives each member a goal; the app shows those under the circle, not in My goals
  goalStore.replaceAll(rows.filter((g) => g.status !== 'closed' && !g.circle_id).map((g) => toGoal(g, prev.get(g.id))))
}

/** One goal's detail and activity (used by the goal screen) */
type ApiMilestones = { months_elapsed: number; interest_paid_total: string; items: { months: number; status: string }[] }

export async function refreshGoal(id: string) {
  const [g, records, ms] = await Promise.all([
    api.get<ApiGoal>(`/goals/${id}/`),
    list<ApiRecord>(`/goals/${id}/activity/`, {}, 2),
    api.get<ApiMilestones>(`/goals/${id}/milestones/`).catch(() => null),
  ])
  const prev = goalStore.all().find((x) => x.id === id)
  goalStore.upsert({
    ...toGoal(g, prev),
    activity: toGoalActivity(records),
    milestones: ms
      ? { months: ms.months_elapsed, interest: fromMoney(ms.interest_paid_total), earned: ms.items.filter((m) => m.status === 'earned').map((m) => m.months) }
      : prev?.milestones,
  })
}

type HomeSummary = { total_savings?: string; locked?: string; available?: string }

export async function refreshWallet() {
  const [balance, records, home] = await Promise.all([
    api.get<{ balance: string }>('/wallet/'),
    list<ApiRecord>('/wallet/transactions/', { page_size: 50 }, 1),
    // /home has no response schema in the spec; read the three totals it describes if present
    api.get<HomeSummary>('/home/').catch(() => null),
  ])
  const summary =
    home && home.total_savings !== undefined
      ? { total: fromMoney(home.total_savings), locked: fromMoney(home.locked), available: fromMoney(home.available) }
      : undefined
  walletStore.replace({ balance: fromMoney(balance.balance), activity: toWalletFeed(records), summary })
}

/** Everything the Adawise home and tabs show. One failing area doesn't stop the others. */
export async function refreshAdawise() {
  const results = await Promise.allSettled([refreshGoals(), refreshWallet(), refreshCircles(), refreshNotices(), refreshSaveMe(), refreshBadges(), refreshProfile()])
  const failed = results.find((r) => r.status === 'rejected')
  if (failed) throw failed.reason
}

/* ---------- notifications ---------- */

type ApiNotification = { id: string; kind: string; title: string; body: string; data: Record<string, unknown> | null; read_at: string | null; created_at: string }

function noticeKind(k: string): Notice['kind'] {
  if (k.startsWith('saveme')) return 'saveme'
  if (k === 'partner_invited') return 'invite'
  if (k.startsWith('partner')) return 'partner'
  if (k.startsWith('circle')) return 'circle'
  if (k === 'milestone_reached' || k === 'goal_completed') return 'milestone'
  return 'money'
}

function toNotice(n: ApiNotification): Notice {
  const d = n.data ?? {}
  // Requests made of *you* (invites, Save Me asks) belong to the partner side
  const forMe = n.kind === 'partner_invited' || n.kind === 'saveme_requested' || n.kind === 'circle_invited'
  const link = forMe
    ? '/adawise/requests'
    : typeof d.circle_id === 'string'
      ? `/adawise/circle/${d.circle_id}`
      : typeof d.goal_id === 'string'
        ? `/adawise/goal/${d.goal_id}`
        : undefined
  return { id: n.id, text: n.body || n.title, date: day(n.created_at), read: !!n.read_at, link, kind: noticeKind(n.kind) }
}

export async function refreshNotices() {
  const rows = await list<ApiNotification>('/notifications/', { page_size: 50 }, 1)
  noticeStore.replaceAll(rows.map(toNotice))
}

export async function markAllNoticesRead() {
  noticeStore.markAllRead()
  await api.post('/notifications/read-all/')
}

/* ---------- Save Me ---------- */

export async function refreshSaveMe() {
  const s = await api.get<{ saveme_used: number; saveme_limit: number; saveme_remaining: number }>('/saveme/status/')
  saveMeStore.replace(s.saveme_used, s.saveme_limit)
}

export type SaveMeStatus = 'pending' | 'approved' | 'declined' | 'expired' | 'cancelled' | 'completed' | 'failed'
type ApiSaveMe = { id: string; partner_name: string | null; amount: string; status: SaveMeStatus }

/** Asks one accepted partner to cover a contribution (the API allows one open request at a time) */
export const askPartner = (goalId: string, partnerId: string, amount: number, message = '') =>
  api.post<ApiSaveMe>(`/goals/${goalId}/saveme/`, { partner_id: partnerId, amount: toMoney(amount), message })

export async function saveMeRequest(id: string) {
  const rows = await list<ApiSaveMe>('/saveme/requests/', {}, 1)
  return rows.find((r) => r.id === id)
}

export const cancelSaveMe = (id: string) => api.post<ApiSaveMe>(`/saveme/requests/${id}/cancel/`)

/* ---------- WiseBadges and profile ---------- */

type ApiBadges = { badges: { months: number; status: string; earned_on: string | null; percent: number }[] }

export async function refreshBadges() {
  const b = await api.get<ApiBadges>('/badges/')
  badgeStore.replace(
    b.badges.map((x) => ({
      months: x.months,
      earned: x.status === 'earned',
      earnedOn: x.earned_on ?? undefined,
      now: Math.min(x.months, Math.floor((x.percent / 100) * x.months)),
    })),
  )
}

type ApiProfile = { name: string; phone: string; total_saved: string; goals_count: number; circles_count: number; loan: { owed: string } }

export async function refreshProfile() {
  const p = await api.get<ApiProfile>('/profile/')
  profileStore.replace({ name: p.name, phone: p.phone, totalSaved: fromMoney(p.total_saved), goals: p.goals_count, circles: p.circles_count, loanOwed: fromMoney(p.loan?.owed) })
}

/* ---------- WiseCircles ---------- */

type ApiCategory = 'hostel_fund' | 'group_trip' | 'school_fees' | 'celebration' | 'business' | 'christmas'
const CATEGORY_ICON: Record<ApiCategory, string> = {
  hostel_fund: 'home',
  group_trip: 'travel',
  school_fees: 'school',
  celebration: 'party',
  business: 'business',
  christmas: 'gift',
}
/** The API only knows six categories; any other icon is sent as the closest fit */
const ICON_CATEGORY: Record<string, ApiCategory> = { home: 'hostel_fund', travel: 'group_trip', school: 'school_fees', party: 'celebration', business: 'business', gift: 'christmas' }

type ApiMember = {
  id: string
  phone: string | null
  status: 'joined' | 'invited' | 'declined' | 'left'
  first_name: string
  initials: string
  is_me: boolean
  percent_of_target: string
  balance: string | null
  target: string | null
}
type ApiCircle = {
  id: string
  name: string
  category: ApiCategory
  show_amounts: boolean
  is_owner: boolean
  plan: { amount_per_period: string; frequency: Frequency; term_months: number; end_date: string; target: string }
  my_goal_id: string | null
  members: ApiMember[]
}
type ApiCircleRow = { id: string; created_at: string }

function toCircle(c: ApiCircle, createdAt: string | undefined, prev?: Circle): Circle {
  const target = fromMoney(c.plan.target)
  return {
    id: c.id,
    name: c.name,
    icon: prev?.icon && ICON_CATEGORY[prev.icon] === c.category ? prev.icon : (CATEGORY_ICON[c.category] ?? 'group'),
    targetPerMember: target,
    months: c.plan.term_months,
    frequency: c.plan.frequency,
    // Detail has no created_at; the list row does (or work it back from the end date)
    createdAt: createdAt ? day(createdAt) : (prev?.createdAt ?? day(c.plan.end_date)),
    showAmounts: c.show_amounts,
    members: c.members
      .filter((m) => m.status === 'joined' || m.status === 'invited')
      .map((m) => {
        const contact = m.phone ? CONTACTS.find((x) => toE164(x.phone) === toE164(m.phone!)) : undefined
        const pct = fromMoney(m.percent_of_target)
        return {
          name: m.is_me ? 'You' : contact && (m.status === 'invited' || /^\W/.test(m.first_name)) ? firstName(contact.name) : m.first_name,
          initials: contact && m.initials === '?' ? initials(contact.name) : m.initials,
          // Amounts are hidden unless show_amounts is on; the % is always there
          saved: m.balance !== null ? fromMoney(m.balance) : Math.round((pct / 100) * target * 100) / 100,
          status: m.status === 'joined' ? 'active' : 'invited',
          you: m.is_me || undefined,
        }
      }),
    // The API has no circle activity feed
    activity: prev?.activity ?? [],
    myGoalId: c.my_goal_id ?? undefined,
    isOwner: c.is_owner,
  }
}

export async function refreshCircles() {
  const rows = await list<ApiCircleRow>('/circles/')
  const prev = new Map(circleStore.all().map((c) => [c.id, c]))
  const details = await Promise.all(rows.map((r) => api.get<ApiCircle>(`/circles/${r.id}/`)))
  circleStore.replaceAll(details.map((c, i) => toCircle(c, rows[i]!.created_at, prev.get(c.id))))
}

export async function refreshCircle(id: string) {
  const c = await api.get<ApiCircle>(`/circles/${id}/`)
  const prev = circleStore.all().find((x) => x.id === id)
  circleStore.upsert(toCircle(c, undefined, prev))
}

export type NewCircleInput = { name: string; icon: string; target: number; months: number; frequency: Frequency; phones: string[]; showAmounts: boolean }

export async function createCircle(input: NewCircleInput): Promise<Circle> {
  const c = await api.post<ApiCircle>('/circles/', {
    name: input.name,
    category: ICON_CATEGORY[input.icon] ?? 'celebration',
    target: toMoney(input.target),
    term_months: input.months,
    frequency: input.frequency,
    member_phones: input.phones.map(toE164),
    show_amounts: input.showAmounts,
  })
  const circle = { ...toCircle(c, new Date().toISOString()), icon: input.icon }
  circleStore.upsert(circle)
  void refreshGoals().catch(() => undefined) // the circle made you a goal
  return circle
}

export async function inviteToCircle(circleId: string, phones: string[]) {
  await api.post(`/circles/${circleId}/members/`, { member_phones: phones.map(toE164) })
  await refreshCircle(circleId)
}

/** Adding money to a circle pays into your own goal in it */
export async function contributeToCircle(circle: Circle, amount: number) {
  if (!circle.myGoalId) throw new ApiError("Your goal in this circle isn't ready yet. Try again in a moment.", 400)
  await contributeToGoal(circle.myGoalId, amount)
  await refreshCircle(circle.id)
}

/* ---------- money movement (MoMo approval is simulated by the backend's provider) ---------- */

const isAttempt = (x: unknown): x is PaymentAttempt => !!x && typeof x === 'object' && 'status' in x && 'direction' in x

/** Deposit: MoMo → Adawise wallet */
export async function depositToWallet(amount: number) {
  const p = await api.post<PaymentAttempt>('/wallet/topups/', { amount: toMoney(amount) }, { idempotent: true })
  await waitForPayment(p)
  await refreshWallet()
}

/** Adawise wallet → MoMo */
export async function withdrawFromWallet(amount: number) {
  const p = await api.post<PaymentAttempt>('/wallet/withdrawals/', { amount: toMoney(amount) }, { idempotent: true })
  await waitForPayment(p)
  await refreshWallet()
}

/** Goal → MoMo (lock rules are enforced by the backend) */
export async function withdrawFromGoal(goalId: string, amount: number) {
  const p = await api.post<PaymentAttempt>(`/goals/${goalId}/withdrawals/`, { amount: toMoney(amount) }, { idempotent: true })
  await waitForPayment(p)
  await Promise.all([refreshGoal(goalId), refreshWallet()])
}

/** MoMo → goal (also used for scheduled contributions and a new goal's first deposit) */
export async function contributeToGoal(goalId: string, amount: number) {
  const res = await api.post<PaymentAttempt | unknown>(`/goals/${goalId}/contributions/`, { amount: toMoney(amount), source: 'momo' }, { idempotent: true })
  if (isAttempt(res)) await waitForPayment(res)
  await Promise.all([refreshGoal(goalId), refreshWallet()])
}

/* ---------- goals ---------- */

export type NewGoalInput = {
  name: string
  icon: string
  type: GoalType
  target: number
  endDate?: string
  plan: { frequency: Frequency; months: number; amount: number; autoSave: boolean; reminders: boolean; startDate: string }
}

export async function createGoal(input: NewGoalInput): Promise<Goal> {
  const g = await api.post<ApiGoal>('/goals/', {
    name: input.name,
    icon: input.icon,
    type: TYPE_OUT[input.type],
    target: toMoney(input.target),
    end_date: input.endDate ?? null,
    schedule: {
      amount_per_period: toMoney(input.plan.amount),
      frequency: input.plan.frequency,
      term_months: input.plan.months,
      start_date: input.plan.startDate,
      auto_save_enabled: input.plan.autoSave,
      reminders_enabled: input.plan.reminders,
    },
  })
  const goal = { ...toGoal(g), activity: [] }
  goalStore.upsert(goal)
  return goal
}

/** "024 412 3456" / "233244123456" → "+233244123456" */
export function toE164(phone: string) {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('233') ? `+${d}` : `+233${d.replace(/^0/, '')}`
}

/** Invites someone to a goal by phone. The API has no saver/supporter choice yet, so the role isn't sent. */
export async function invitePartner(goalId: string, phone: string) {
  await api.post(`/goals/${goalId}/partners/`, { phone: toE164(phone) })
}

/** Auto-save / reminders toggles; optimistic, rolled back if the API refuses */
export async function updateGoalSettings(goalId: string, patch: { autoSave?: boolean; reminders?: boolean }) {
  const before = goalStore.all().find((g) => g.id === goalId)
  goalStore.update(goalId, (g) => (g.plan ? { ...g, plan: { ...g.plan, ...patch } } : g))
  try {
    await api.patch(`/goals/${goalId}/settings/`, { auto_save_enabled: patch.autoSave, reminders_enabled: patch.reminders })
  } catch (e) {
    if (before) goalStore.upsert(before)
    throw e
  }
}

export const errorText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : 'Something went wrong. Please try again.')

/* ---------- closing, leaving, removing ---------- */

/** Closes a goal for good. The API needs its balance at zero first. */
export async function closeGoal(goalId: string) {
  await api.post(`/goals/${goalId}/close/`)
  goalStore.remove(goalId)
  void refreshWallet().catch(() => undefined)
}

/** Sends what's left in the goal to MoMo, then closes it */
export async function withdrawAllAndClose(goal: Goal) {
  if (goal.saved > 0) await withdrawFromGoal(goal.id, goal.saved)
  await closeGoal(goal.id)
}

/** Leaves a circle (not its owner). Your goal in it becomes a personal goal, money and all. */
export async function leaveCircle(circleId: string) {
  await api.post(`/circles/${circleId}/leave/`)
  circleStore.remove(circleId)
  await refreshGoals()
}

export async function removePartner(goalId: string, partnerId: string) {
  await api.delete(`/goals/${goalId}/partners/${partnerId}/`)
  await refreshGoal(goalId)
}
