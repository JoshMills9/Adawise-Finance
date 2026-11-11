// Dummy Adawise data for the hackathon demo. Replace with calls to the Adawise backend.

export type GoalType = 'flexible' | 'goal-locked' | 'time-locked'
export type Frequency = 'daily' | 'weekly' | 'monthly'

export type Partner = { name: string; initials: string; role: 'saver' | 'supporter'; status?: 'invited' | 'active' }
export const MAX_PARTNERS = 2

export type ActivityKind = 'deposit' | 'auto-save' | 'withdrawal' | 'rescue' | 'interest' | 'credit'
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
  /** Active Save Me credit taken against this goal's fixed deposit */
  credit?: { amount: number; due: string }
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
}

export const MAX_CIRCLE_MEMBERS = 10

export const GOALS: Goal[] = [
  {
    id: 'laptop',
    name: 'New laptop',
    icon: 'laptop',
    type: 'goal-locked',
    saved: 3200,
    target: 5000,
    createdAt: '2026-04-20',
    partners: [{ name: 'Kofi', initials: 'KA', role: 'saver', status: 'active' }],
    nextContribution: { amount: 250, due: '2026-11-15' },
    plan: { frequency: 'weekly', months: 12, amount: 250, autoSave: true, reminders: true },
    activity: [
      { id: 'l4', kind: 'auto-save', amount: 250, date: '2026-11-08' },
      { id: 'l3', kind: 'auto-save', amount: 250, date: '2026-11-01' },
      { id: 'l2', kind: 'interest', amount: 60, date: '2026-10-20', note: '6-month milestone' },
      { id: 'l1', kind: 'deposit', amount: 500, date: '2026-10-14' },
    ],
  },
  {
    id: 'rent',
    name: 'Rent',
    icon: 'home',
    type: 'time-locked',
    saved: 750,
    target: 3000,
    createdAt: '2026-09-12',
    unlockDate: '2027-03-12',
    partners: [
      { name: 'Esi', initials: 'EB', role: 'supporter', status: 'active' },
      { name: 'Yaw', initials: 'YM', role: 'supporter', status: 'active' },
    ],
    nextContribution: { amount: 500, due: '2026-11-18' },
    plan: { frequency: 'monthly', months: 6, amount: 500, autoSave: true, reminders: true },
    activity: [
      { id: 'r2', kind: 'auto-save', amount: 500, date: '2026-10-18' },
      { id: 'r1', kind: 'deposit', amount: 250, date: '2026-09-12', note: 'First deposit' },
    ],
  },
  {
    id: 'emergency',
    name: 'Emergency',
    icon: 'medical',
    type: 'flexible',
    saved: 200,
    target: 500,
    createdAt: '2026-07-01',
    nextContribution: { amount: 50, due: '2026-11-20' },
    plan: { frequency: 'weekly', months: 3, amount: 50, autoSave: false, reminders: true },
    activity: [
      { id: 'e3', kind: 'withdrawal', amount: 100, date: '2026-10-30', note: 'Hospital bill' },
      { id: 'e2', kind: 'deposit', amount: 150, date: '2026-09-02' },
      { id: 'e1', kind: 'deposit', amount: 150, date: '2026-07-01', note: 'First deposit' },
    ],
  },
]

export const CIRCLES: Circle[] = [
  {
    id: 'hostel',
    name: 'Hostel fund',
    icon: 'home',
    targetPerMember: 2000,
    months: 6,
    frequency: 'weekly',
    createdAt: '2026-09-01',
    showAmounts: false,
    members: [
      { name: 'Ama', initials: 'AM', saved: 1640, status: 'active' },
      { name: 'You', initials: 'YO', saved: 1280, status: 'active', you: true },
      { name: 'Efua', initials: 'EF', saved: 1160, status: 'active' },
      { name: 'Kofi', initials: 'KA', saved: 1100, status: 'active' },
      { name: 'Yaw', initials: 'YB', saved: 620, status: 'active' },
    ],
    activity: [
      { id: 'h4', text: 'Ama saved this week · 82% there', date: '2026-11-09' },
      { id: 'h3', text: 'Kofi passed the halfway mark', date: '2026-11-04' },
      { id: 'h2', text: 'You saved this week · 64% there', date: '2026-11-02' },
      { id: 'h1', text: 'Yaw joined the circle', date: '2026-09-03' },
    ],
  },
  {
    id: 'trip',
    name: 'Family trip',
    icon: 'travel',
    targetPerMember: 1500,
    months: 9,
    frequency: 'monthly',
    createdAt: '2026-10-01',
    showAmounts: true,
    members: [
      { name: 'You', initials: 'YO', saved: 360, status: 'active', you: true },
      { name: 'Akos', initials: 'AK', saved: 270, status: 'active' },
      { name: 'Nana', initials: 'NA', saved: 270, status: 'active' },
    ],
    activity: [
      { id: 't2', text: 'Akos and Nana saved for October', date: '2026-10-28' },
      { id: 't1', text: 'You created the circle', date: '2026-10-01' },
    ],
  },
]

export const SAVE_ME = { used: 1, allowed: 3 }
export const FIXED_DEPOSITS = 2000
export const INTEREST_EARNED = 75
export const WISE_BADGES = 4
export const PARTNER_REQUESTS = 1
export const MILESTONES = [3, 6, 9, 12]
/** Demo terms for Save Me credit against a fixed deposit */
export const CREDIT = { maxShare: 0.8, months: 3, feeRate: 0.06 }

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

export const totals = (goals: Goal[] = GOALS) => {
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
    return g.saved >= g.target
      ? { allowed: true, reason: 'Target reached · unlocked' }
      : { allowed: false, reason: `Locked until you reach ${ghs(g.target, 0)} · ${ghs(g.target - g.saved, 0)} to go` }
  }
  const days = daysUntil(g.unlockDate!)
  return days <= 0
    ? { allowed: true, reason: 'Lock period over · unlocked' }
    : { allowed: false, reason: `Locked until ${shortDate(g.unlockDate!)} · ${days} day${days === 1 ? '' : 's'} left` }
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

export const NOTICES: Notice[] = [
  { id: 'n4', kind: 'saveme', text: 'Kwesi asked you for a Save Me rescue of GHS 300', date: '2026-11-11', read: false, link: '/adawise/requests/sm-kwesi' },
  { id: 'n3', kind: 'invite', text: 'Abena invited you to support her Wedding goal', date: '2026-11-10', read: false, link: '/adawise/requests/inv-abena' },
  { id: 'n2', kind: 'circle', text: 'Kofi passed the halfway mark in Hostel fund', date: '2026-11-04', read: true, link: '/adawise/circle/hostel' },
  { id: 'n1', kind: 'milestone', text: 'New laptop hit its 6-month milestone: GHS 60 interest paid upfront', date: '2026-10-20', read: true, link: '/adawise/goal/laptop' },
]

/** Save Me terms a partner accepts (from the Adawise product doc) */
export const SAVE_ME_TERMS = [
  'Helping is always voluntary. You can decline any request.',
  'Save Me contributions are support, not loans. They are not paid back.',
  'Each saver can receive up to 3 successful rescues per calendar year.',
  'You approve every payment through MoMo and your Save Me PIN.',
  'You can follow their progress, but you never own, control or withdraw their savings.',
]
