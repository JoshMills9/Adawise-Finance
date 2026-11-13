// Adawise app types, rules and maths. Goals, circles, wallet and notifications come from the
// Adawise API (lib/adawise.ts); the dummy data left here is the partner side, still hidden.

export type GoalType = 'flexible' | 'goal-locked' | 'time-locked'
export type Frequency = 'daily' | 'weekly' | 'monthly'

export type Partner = { name: string; initials: string; role: 'saver' | 'supporter'; status?: 'invited' | 'active'; /** API GoalPartner id */ id?: string }
export const MAX_PARTNERS = 2

export type ActivityKind = 'deposit' | 'auto-save' | 'withdrawal' | 'rescue' | 'interest' | 'credit' | 'repayment'
export type Activity = { id: string; kind: ActivityKind; amount: number; date: string; note?: string }

export type Goal = {
  id: string
  name: string
  type: GoalType
  saved: number
  target: number
  /** ISO date the goal was created (drives the 3/6/9/12-month milestones) */
  createdAt: string
  /** ISO date, only for time-locked goals */
  unlockDate?: string
  /** Up to MAX_PARTNERS accountability partners */
  partners?: Partner[]
  nextContribution?: { amount: number; due: string }
  plan?: { frequency: Frequency; months: number; amount: number; autoSave: boolean; reminders: boolean }
  icon?: string
  activity?: Activity[]
  /** Milestone progress reported by the API (overrides the local maths when present) */
  milestones?: { months: number; interest: number; earned: number[] }
  /** Lock state reported by the API (overrides the local lock maths when present) */
  lock?: { locked: boolean; message?: string }
  /** Active Save Me credit taken against this goal's fixed deposit */
  credit?: { amount: number; due: string; repaid?: number; takenOn?: string }
}

export type CircleMember = { name: string; initials: string; saved: number; status: 'active' | 'invited'; you?: boolean }
export type Circle = {
  id: string
  name: string
  icon: string
  /** Every member saves towards their own goal of this amount */
  targetPerMember: number
  months: number
  frequency: Frequency
  createdAt: string
  /** false = members only see each other's % progress */
  showAmounts: boolean
  members: CircleMember[]
  activity: { id: string; text: string; date: string }[]
  /** API: the circle's goal for you (adding money pays into it) */
  myGoalId?: string
  isOwner?: boolean
}

export const MAX_CIRCLE_MEMBERS = 10

export const SAVE_ME = { used: 1, allowed: 3 }
export const FIXED_DEPOSITS = 2000
export const INTEREST_EARNED = 75
export const MILESTONES = [3, 6, 9, 12]
/** Demo terms for Save Me credit against a fixed deposit */
export const CREDIT = { maxShare: 0.8, months: 3, feeRate: 0.06 }
/** What a Save Me credit costs in total (amount + fee), and what's still left to pay */
export const creditOwed = (c: NonNullable<Goal['credit']>) => Math.round(c.amount * (1 + CREDIT.feeRate) * 100) / 100
export const creditLeft = (c: NonNullable<Goal['credit']>) => Math.max(0, Math.round((creditOwed(c) - (c.repaid ?? 0)) * 100) / 100)

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  flexible: 'Flexible',
  'goal-locked': 'Goal-locked',
  'time-locked': 'Time-locked',
}

export function ghs(n: number, decimals = 2) {
  return 'GHS ' + n.toLocaleString('en-GH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function shortDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const totals = (goals: Goal[]) => {
  const total = goals.reduce((s, g) => s + g.saved, 0)
  const available = goals.filter((g) => g.type === 'flexible').reduce((s, g) => s + g.saved, 0)
  return { total, locked: total - available, available }
}

/** Whole months between an ISO date and today */
export function monthsSince(iso: string) {
  const a = new Date(iso + 'T00:00:00')
  const b = new Date()
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0)
}

export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso + 'T00:00:00').getTime() - Date.now()) / 86_400_000)
}

/** Can money leave this goal right now, and if not, why? */
export function withdrawRule(g: Goal): { allowed: boolean; reason: string } {
  if (g.type === 'flexible') return { allowed: true, reason: 'Withdraw anytime' }
  if (g.type === 'goal-locked') {
    const open = g.lock ? !g.lock.locked : g.saved >= g.target
    return open
      ? { allowed: true, reason: 'Target reached · unlocked' }
      : { allowed: false, reason: `Locked until you reach ${ghs(g.target, 0)} · ${ghs(Math.max(0, g.target - g.saved), 0)} to go` }
  }
  const days = g.unlockDate ? daysUntil(g.unlockDate) : 0
  const open = g.lock ? !g.lock.locked : days <= 0
  if (open) return { allowed: true, reason: 'Lock period over · unlocked' }
  return g.unlockDate
    ? { allowed: false, reason: `Locked until ${shortDate(g.unlockDate)} · ${days} day${days === 1 ? '' : 's'} left` }
    : { allowed: false, reason: g.lock?.message || 'Locked until the end date' }
}

const active = (c: Circle) => c.members.filter((m) => m.status === 'active')
export const memberPct = (c: Circle, m: CircleMember) => Math.min(100, Math.round((m.saved / c.targetPerMember) * 100))
export const circleProgress = (c: Circle) => {
  const ms = active(c)
  return ms.length ? Math.round(ms.reduce((s, m) => s + memberPct(c, m), 0) / ms.length) : 0
}

/* ---------- partner side: what other people ask of *you* ---------- */

export const CONTACTS = [
  { name: 'Kofi Asante', phone: '024 412 3456' },
  { name: 'Esi Boateng', phone: '020 198 7654' },
  { name: 'Yaw Mensah', phone: '055 422 2333' },
  { name: 'Akosua Owusu', phone: '027 744 4555' },
  { name: 'Ama Darko', phone: '024 555 1212' },
  { name: 'Kwame Ofori', phone: '050 333 9090' },
]

type RequestBase = { id: string; from: string; initials: string; goalName: string; goalIcon: string; date: string }
export type InviteRequest = RequestBase & {
  kind: 'invite'
  goalType: GoalType
  target: number
  saved: number
  role: 'saver' | 'supporter'
  status: 'pending' | 'accepted' | 'declined'
}
export type SaveMeRequest = RequestBase & {
  kind: 'saveme'
  amount: number
  reason: string
  /** Successful Save Me rescues the requester has used this year (before this one) */
  theirUsed: number
  supportedId: string
  status: 'pending' | 'approved' | 'declined'
}
export type PartnerRequest = InviteRequest | SaveMeRequest

/** A goal someone else owns where you're their accountability partner */
export type SupportedGoal = {
  id: string
  person: string
  initials: string
  goalName: string
  icon: string
  type: GoalType
  saved: number
  target: number
  role: 'saver' | 'supporter'
  /** Their recent consistency, shown to partners */
  streak: string
}

export const REQUESTS: PartnerRequest[] = [
  {
    id: 'sm-kwesi',
    kind: 'saveme',
    from: 'Kwesi Appiah',
    initials: 'KW',
    goalName: 'School fees',
    goalIcon: 'school',
    amount: 300,
    reason: 'School fees deadline moved forward',
    theirUsed: 1,
    supportedId: 'kwesi-school',
    date: '2026-11-11',
    status: 'pending',
  },
  {
    id: 'inv-abena',
    kind: 'invite',
    from: 'Abena Kyei',
    initials: 'AK',
    goalName: 'Wedding',
    goalIcon: 'ring',
    goalType: 'goal-locked',
    target: 8000,
    saved: 2400,
    role: 'supporter',
    date: '2026-11-10',
    status: 'pending',
  },
]

export const SUPPORTING: SupportedGoal[] = [
  {
    id: 'kwesi-school',
    person: 'Kwesi',
    initials: 'KW',
    goalName: 'School fees',
    icon: 'school',
    type: 'time-locked',
    saved: 1800,
    target: 2500,
    role: 'supporter',
    streak: 'Saved 7 of the last 8 weeks',
  },
]

export type Notice = {
  id: string
  text: string
  date: string
  read: boolean
  link?: string
  kind: 'saveme' | 'invite' | 'milestone' | 'circle' | 'partner' | 'money'
}

/**
 * Partner side (requests sent to you, goals you support, partner badges).
 * Hidden for now; set to true to bring it back everywhere.
 */
export const SHOW_PARTNER_SIDE = false

/** Save Me terms a partner accepts (from the Adawise product doc) */
export const SAVE_ME_TERMS = [
  'Helping is always voluntary. You can decline any request.',
  'Save Me contributions are support, not loans. They are not paid back.',
  'Each saver can receive up to 3 successful rescues per calendar year.',
  'You approve every payment through MoMo and your Save Me PIN.',
  'You can follow their progress, but you never own, control or withdraw their savings.',
]

/* ---------- WiseBadges: the visible side of the incentives ---------- */
// Saver badges = the 3/6/9/12-month savings milestones (savings go into a fixed deposit, interest paid upfront).
// Partner badges = taking part as an accountability partner (partner incentives).

export type BadgeIconName = 'milestone' | 'heart' | 'lifebuoy' | 'circle'
export type Badge = {
  id: string
  group: 'saver' | 'partner'
  name: string
  /** How to earn it */
  how: string
  /** The incentive attached to it */
  reward: string
  icon: BadgeIconName
  /** Milestone number shown on the medal (3, 6, 9, 12) */
  label?: string
  earned: boolean
  /** ISO date it was earned, when known */
  earnedOn?: string
  progress: { now: number; of: number; unit: string }
  /** Goals that reached this milestone, with the interest each was paid for it */
  goals?: { id: string; name: string; interest: number }[]
}

const addMonths = (isoDate: string, m: number) => {
  const d = new Date(isoDate + 'T00:00:00')
  d.setMonth(d.getMonth() + m)
  return d.toISOString().slice(0, 10)
}

export function computeBadges(input: { goals: Goal[]; circles: Circle[]; supporting: SupportedGoal[]; requests: PartnerRequest[] }): Badge[] {
  const { goals, circles, supporting, requests } = input
  const longest = Math.max(0, ...goals.map((g) => monthsSince(g.createdAt)))

  const saver: Badge[] = MILESTONES.map((m) => {
    const reached = goals.filter((g) => monthsSince(g.createdAt) >= m)
    return {
      id: `milestone-${m}`,
      group: 'saver',
      name: `${m}-month saver`,
      how: `Keep a goal going for ${m} months.`,
      reward: 'Qualifying savings move into a fixed deposit and you get the interest upfront.',
      icon: 'milestone',
      label: String(m),
      earned: reached.length > 0,
      earnedOn: reached.length ? reached.map((g) => addMonths(g.createdAt, m)).sort()[0] : undefined,
      progress: { now: Math.min(longest, m), of: m, unit: 'months' },
      goals: reached.map((g) => ({
        id: g.id,
        name: g.name,
        interest: (g.activity ?? []).filter((a) => a.kind === 'interest' && a.note?.startsWith(`${m}-month`)).reduce((t, a) => t + a.amount, 0),
      })),
    }
  })

  const rescues = requests.filter((r) => r.kind === 'saveme' && r.status === 'approved').length
  const partner: Badge[] = [
    {
      id: 'partner',
      group: 'partner',
      name: 'Accountability partner',
      how: "Support someone's goal as their accountability partner.",
      reward: 'Partner incentive',
      icon: 'heart',
      earned: supporting.length > 0,
      progress: { now: Math.min(1, supporting.length), of: 1, unit: 'goal' },
    },
    {
      id: 'circle-saver',
      group: 'partner',
      name: 'Circle saver',
      how: 'Save together with others in a WiseCircle.',
      reward: 'Partner incentive',
      icon: 'circle',
      earned: circles.length > 0,
      progress: { now: Math.min(1, circles.length), of: 1, unit: 'circle' },
    },
    {
      id: 'save-me-hero',
      group: 'partner',
      name: 'Save Me hero',
      how: 'Help someone with a Save Me request.',
      reward: 'Partner incentive',
      icon: 'lifebuoy',
      earned: rescues > 0,
      progress: { now: Math.min(1, rescues), of: 1, unit: 'rescue' },
    },
  ]
  return SHOW_PARTNER_SIDE ? [...saver, ...partner] : saver
}
