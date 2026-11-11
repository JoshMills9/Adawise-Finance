import { useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui'
import {
  BadgeIcon,
  BellIcon,
  ChevronRight,
  ClockIcon,
  DropletIcon,
  EyeIcon,
  EyeOffIcon,
  FlagIcon,
  LifebuoyIcon,
  LockIcon,
  PlusIcon,
  UsersIcon,
  VaultIcon,
  WalletIcon,
} from '../components/icons'
import {
  FIXED_DEPOSITS,

  GOAL_TYPE_LABEL,
  INTEREST_EARNED,
  WISE_BADGES,
  circleProgress,
  ghs,
  shortDate,
  totals,
  type Circle,
  type Goal,
  type SupportedGoal,
} from '../lib/demoData'
import { useThemeColor } from '../lib/useThemeColor'
import { Glyph } from '../components/goalIcons'
import { MoneySheet } from '../components/ada'
import { goalStore, noticeStore, useCircles, useGoals, useRequests, useSaveMe, useSupporting, useUnreadCount } from "../lib/goalStore"

const ADA_DARK = '#0F3D3E'

type Icon = ComponentType<{ size?: number }>
/** Max items per list on the Adawise home; the arrows open the full lists */
const HOME_LIMIT = 3

function CloseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  )
}

/** Adawise home inside MoMo: wallet → quick actions → highlights → contributions → goals → circles */
export function Adawise() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const [toast, toastNode] = useToast()
  const [hidden, setHidden] = useState(false)
  const [paying, setPaying] = useState<Goal | null>(null)
  const goals = useGoals()
  const circles = useCircles()
  const saveMe = useSaveMe()
  const unread = useUnreadCount()
  const pending = useRequests().filter((r) => r.status === 'pending')
  const supporting = useSupporting()
  const pendingInvites = pending.filter((r) => r.kind === 'invite').length
  const pendingSaveMe = pending.filter((r) => r.kind === 'saveme').length
  const { total, locked, available } = totals(goals)
  const money = (n: number) => (hidden ? 'GHS ****' : ghs(n))

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(32px+env(safe-area-inset-bottom))]">
        {/* ---- Header + wallet, laid out like the MoMo home but in Adawise teal ---- */}
        <section className="relative">
          <div
            className="ada-card-gradient absolute inset-x-0 top-0 h-[calc(232px+env(safe-area-inset-top))]"
            style={{ borderBottomLeftRadius: '50% 22px', borderBottomRightRadius: '50% 22px' }}
          />

          <div className="relative flex items-center justify-between px-[14px] pt-[calc(env(safe-area-inset-top)+10px)]">
            <button
              type="button"
              aria-label="Close Adawise"
              onClick={() => navigate('/home', { replace: true })}
              className="grid size-11 place-items-center text-white active:opacity-60"
            >
              <CloseIcon />
            </button>
            <h1 className="text-[20px] font-bold tracking-[0.02em] text-white">Adawise</h1>
            <button
              type="button"
              aria-label={`Notifications, ${unread} new`}
              onClick={() => navigate('/adawise/notifications')}
              className="relative grid size-11 place-items-center text-white active:opacity-60"
            >
              <BellIcon size={28} />
              {unread > 0 && (
                <span className="absolute right-[4px] top-[4px] grid h-[18px] min-w-[18px] place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-ink">
                  {unread}
                </span>
              )}
            </button>
          </div>

          {/* Wallet card (white, like the MoMo wallet) */}
          <div className="relative mx-4 mt-[22px] overflow-hidden rounded-[14px] bg-white shadow-[0_6px_20px_rgba(8,36,38,0.14)]">
            <span className="absolute left-0 top-0 flex items-center gap-1 rounded-br-[8px] bg-ada px-2 py-[3px] text-[11px] font-semibold text-white">
              <WalletIcon size={12} /> Wallet
            </span>
            <button
              type="button"
              aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
              onClick={() => setHidden((h) => !h)}
              className="absolute right-[14px] top-[42px] text-ada-dark active:opacity-60"
            >
              {hidden ? <EyeIcon size={28} /> : <EyeOffIcon size={28} />}
            </button>

            <div className="px-4 pb-[14px] pt-[30px] text-center">
              <p className="text-[13px] text-muted">Total savings</p>
              <p className="mt-[2px] text-[27px] font-bold text-ada-dark">{money(total)}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-[#e6e6e6] py-[12px]">
              <div className="text-center">
                <p className="text-[12.5px] text-muted">Locked</p>
                <p className="mt-[2px] text-[16px] font-bold text-ada-dark">{money(locked)}</p>
              </div>
              <div className="border-l-[1.5px] border-ada/50 text-center">
                <p className="text-[12.5px] text-muted">Available</p>
                <p className="mt-[2px] text-[16px] font-bold text-ada">{money(available)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Quick actions ---- */}
        <section className="grid grid-cols-2 gap-3 px-4 pt-4">
          <QuickAction icon={FlagIcon} title="Create goal" subtitle="On your own" onClick={() => navigate("/adawise/new-goal")} />
          <QuickAction icon={UsersIcon} title="Create circle" subtitle="With others" onClick={() => navigate("/adawise/new-circle")} />
        </section>

        {/* ---- Requests for you (invites + Save Me asks from people you support) ---- */}
        <section className="px-4 pt-3">
            <button
              type="button"
              onClick={() => navigate('/adawise/requests')}
              className={`flex w-full items-center justify-between gap-3 rounded-[16px] px-4 py-[14px] text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${pending.length ? 'bg-white ring-2 ring-ada/40' : 'bg-white'}`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="text-ada-dark">
                  <UsersIcon size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-ada-dark">Requests for you</span>
                  <span className="block truncate text-[12.5px] text-muted">
                    {pending.length
                      ? [
                          pendingSaveMe && `${pendingSaveMe} Save Me request${pendingSaveMe > 1 ? 's' : ''}`,
                          pendingInvites && `${pendingInvites} invite${pendingInvites > 1 ? 's' : ''}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : 'All caught up'}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {pending.length > 0 && <span className="rounded-full bg-ada-soft px-2 py-[2px] text-[12px] font-semibold text-ada">{pending.length} new</span>}
                <span className="text-dot">
                  <ChevronRight size={18} />
                </span>
              </span>
            </button>
        </section>

        {/* ---- Highlights (swipe) ---- */}
        <section className="mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Highlight
            icon={LifebuoyIcon}
            image="save-me"
            label="Save Me left"
            value={`${saveMe.left} of ${saveMe.allowed}`}
            note="Resets 1 Jan"
            tone="from-[#0f3d3e] to-[#14b39f]"
          />
          <Highlight
            icon={VaultIcon}
            image="fixed-deposits"
            label="Fixed deposits"
            value={hidden ? 'GHS ****' : ghs(FIXED_DEPOSITS, 0)}
            note={`Interest earned ${ghs(INTEREST_EARNED, 0)}`}
            tone="from-[#082426] to-[#0f5a55]"
          />
          <Highlight icon={BadgeIcon} image="badges" label="WiseBadges" value={String(WISE_BADGES)} note="Stay steady" tone="from-[#0f3d3e] to-[#2bbfa9]" />
          <Highlight icon={UsersIcon} image="circles" label="Active circles" value={String(circles.length)} note="Growing" tone="from-[#0b2f31] to-[#1a7f72]" />
        </section>

        {/* ---- Next contributions ---- */}
        <SectionHeader title="Next contributions" onMore={() => navigate('/adawise/contributions')} />
        {/* Compact list: one row per upcoming payment */}
        <section className="mx-4 divide-y divide-[#eef0f1] overflow-hidden rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {upcoming(goals)
            .slice(0, 3)
            .map((g) => (
              <ContributionRow key={g.id} goal={g} money={money} onPay={() => setPaying(g)} />
            ))}
        </section>

        {/* ---- My goals ---- */}
        <SectionHeader title="My goals" onMore={() => navigate('/adawise/goals')} />
        <section className="flex flex-col gap-3 px-4">
          {goals.slice(0, HOME_LIMIT).map((g) => (
            <GoalCard key={g.id} goal={g} money={money} onClick={() => navigate(`/adawise/goal/${g.id}`)} />
          ))}

        </section>

        {/* ---- My circles ---- */}
        <SectionHeader title="My circles" onMore={() => navigate('/adawise/circles')} />
        <section className="flex flex-col gap-3 px-4">
          {circles.slice(0, HOME_LIMIT).map((c) => (
            <CircleCard key={c.id} circle={c} onClick={() => navigate(`/adawise/circle/${c.id}`)} />
          ))}
        </section>

        {/* ---- Goals you support (you're their accountability partner) ---- */}
        {supporting.length > 0 && (
          <>
            <SectionHeader title="Goals you support" onMore={() => navigate('/adawise/supporting')} />
            <section className="flex flex-col gap-3 px-4">
              {supporting.slice(0, HOME_LIMIT).map((sg) => (
                <SupportedCard
                  key={sg.id}
                  goal={sg}
                  onCheer={() => {
                    noticeStore.push({ kind: 'partner', text: `You cheered on ${sg.person} for ${sg.goalName}` })
                    toast(`Encouragement sent to ${sg.person}`)
                  }}
                />
              ))}
            </section>
          </>
        )}
      </main>
      {/* Pay a scheduled contribution right here: straight to payment approval */}
      <MoneySheet
        open={paying !== null}
        mode="deposit"
        title="Confirm payment"
        to={paying?.name ?? ""}
        fixedAmount={paying?.nextContribution?.amount}
        onClose={() => setPaying(null)}
        onDone={(amt) => {
          if (paying) goalStore.payContribution(paying.id)
          toast(`${ghs(amt)} saved to ${paying?.name}`)
          setPaying(null)
        }}
      />
      {toastNode}
    </div>
  )
}

/* ---------- pieces ---------- */

function QuickAction({ icon: I, title, subtitle, onClick }: { icon: Icon; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-[16px] bg-white p-3 text-left shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition active:scale-[0.98]"
    >
      <span className="relative grid size-[44px] shrink-0 place-items-center rounded-[12px] bg-ada-soft text-ada">
        <I size={24} />
        <span className="absolute -bottom-1 -right-1 grid size-[18px] place-items-center rounded-full bg-ada text-white ring-2 ring-white">
          <PlusIcon size={12} />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-ada-dark">{title}</span>
        <span className="block truncate text-[12px] text-muted">{subtitle}</span>
      </span>
    </button>
  )
}

/**
 * Swipeable stat card. Drop a photo at /public/adawise/highlights/<image>.jpg and it
 * shows behind a dark overlay (like the Adawise app); until then the gradient is used.
 */
function Highlight({
  icon: I,
  image,
  label,
  value,
  note,
  tone,
}: {
  icon: Icon
  image: string
  label: string
  value: string
  note: string
  tone: string
}) {
  const [photo, setPhoto] = useState(false)
  return (
    <div className={`relative w-[62%] shrink-0 snap-start overflow-hidden rounded-[18px] bg-gradient-to-br ${tone} p-4 text-white`}>
      <img
        src={`/adawise/highlights/${image}.jpg`}
        alt=""
        onLoad={() => setPhoto(true)}
        className={`absolute inset-0 h-full w-full object-cover ${photo ? '' : 'hidden'}`}
      />
      {photo ? (
        <span className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/10" />
      ) : (
        <span className="absolute -right-3 -top-3 opacity-15">
          <I size={86} />
        </span>
      )}
      <p className="relative text-[14px] font-semibold text-white/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">{label}</p>
      <p className="relative mt-1 text-[28px] font-bold leading-tight [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">{value}</p>
      <p className="relative mt-1 text-[13px] text-white/85">{note}</p>
    </div>
  )
}

function SectionHeader({ title, onMore }: { title: string; onMore: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-between px-4 pb-3">
      <h2 className="text-[19px] font-bold text-ink">{title}</h2>
      <button type="button" aria-label={`See all ${title}`} onClick={onMore} className="text-ink active:opacity-60">
        <ChevronRight size={22} />
      </button>
    </div>
  )
}

function Progress({ value }: { value: number }) {
  return (
    <div className="my-[10px] h-[7px] overflow-hidden rounded-full bg-[#e6ebec]">
      <div className="h-full rounded-full bg-ada" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

function Avatar({ initials, ring }: { initials: string; ring?: boolean }) {
  return (
    <span
      className={`grid size-[30px] shrink-0 place-items-center rounded-full bg-ada-soft text-[10.5px] font-bold tracking-normal text-ada-dark ${ring ? 'ring-2 ring-white' : ''}`}
    >
      {initials}
    </span>
  )
}

const TYPE_ICON: Record<Goal['type'], Icon> = {
  'goal-locked': LockIcon,
  'time-locked': ClockIcon,
  flexible: DropletIcon,
}

/** "Saving with Kofi", "Supported by Esi & Yaw", "Invites sent to Kofi & Esi"… */
function partnerSummary(ps: NonNullable<Goal['partners']>) {
  const names = ps.map((p) => p.name).join(' & ')
  if (ps.every((p) => p.status === 'invited')) return `${ps.length > 1 ? 'Invites' : 'Invite'} sent to ${names}`
  if (ps.every((p) => p.role === 'saver')) return `Saving with ${names}`
  if (ps.every((p) => p.role === 'supporter')) return `Supported by ${names}`
  return names
}

export function GoalCard({ goal: g, money, onClick }: { goal: Goal; money: (n: number) => string; onClick: () => void }) {
  const I = TYPE_ICON[g.type]
  const pct = Math.round((g.saved / g.target) * 100)
  const unlock: ReactNode =
    g.type === 'goal-locked'
      ? `Unlocks at ${ghs(g.target, 0)}`
      : g.type === 'time-locked'
        ? `Unlocks ${shortDate(g.unlockDate!)}`
        : 'Withdraw anytime'

  return (
    <button type="button" onClick={onClick} className="rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[16px] font-bold text-ada-dark">
          <I size={20} /> {g.name}
        </span>
        <span className="rounded-full bg-[#eef2f4] px-2 py-[2px] text-[12px] font-semibold text-muted">{GOAL_TYPE_LABEL[g.type]}</span>
      </div>
      <Progress value={pct} />
      <div className="flex items-center justify-between text-[13px] text-muted">
        <span>
          <span className="font-semibold text-ink">{money(g.saved)}</span> / {ghs(g.target, 0)}
        </span>
        <span className="font-semibold text-ada">{pct}%</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[12.5px] text-muted">
        <span>{unlock}</span>
        {g.partners?.length ? (
          <span className="flex min-w-0 items-center gap-[6px]">
            <span className="flex shrink-0 -space-x-[5px]">
              {g.partners.map((p) => (
                <Avatar key={p.name} initials={p.initials} ring />
              ))}
            </span>
            <span className="truncate">{partnerSummary(g.partners)}</span>
          </span>
        ) : null}
      </div>
    </button>
  )
}

/** Goals with a next contribution, soonest first */
export const upcoming = (goals: Goal[]) =>
  goals.filter((g) => g.nextContribution).sort((a, b) => a.nextContribution!.due.localeCompare(b.nextContribution!.due))

export function ContributionRow({ goal: g, money, onPay }: { goal: Goal; money: (n: number) => string; onPay: () => void }) {
  return (
    <div className="flex items-center gap-3 px-[14px] py-[12px]">
      <span className="grid size-[40px] shrink-0 place-items-center rounded-[12px] bg-ada-soft text-ada">
        <Glyph name={g.icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-ada-dark">{g.name}</p>
        <p className="truncate text-[12.5px] text-muted">
          Due {shortDate(g.nextContribution!.due)} · {g.partners?.some((p) => p.role === 'saver') ? 'Circle' : 'Personal'}
        </p>
      </div>
      <p className="shrink-0 text-[15px] font-bold text-ink">{money(g.nextContribution!.amount)}</p>
      <button type="button" onClick={onPay} className="h-[34px] shrink-0 rounded-full bg-ada px-[14px] text-[13px] font-bold text-white active:brightness-110">
        Pay
      </button>
    </div>
  )
}

export function CircleCard({ circle: c, onClick }: { circle: Circle; onClick: () => void }) {
  const pct = circleProgress(c)
  return (
    <button type="button" onClick={onClick} className="rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-[16px] font-bold text-ada-dark">
          <span className="inline-flex items-center gap-2">
            <Glyph name={c.icon} size={18} className="text-ada" />
            {c.name}
          </span>
        </span>
        <span className="text-[13px] text-muted">{c.members.length} members</span>
      </div>
      <Progress value={pct} />
      <div className="flex items-center justify-between">
        <div className="flex -space-x-[6px]">
          {c.members.slice(0, 4).map((m) => (
            <Avatar key={m.name} initials={m.initials} ring />
          ))}
          {c.members.length > 4 && (
            <span className="grid size-[30px] place-items-center rounded-full bg-[#e9e9e9] text-[11px] font-bold text-muted ring-2 ring-white">
              +{c.members.length - 4}
            </span>
          )}
        </div>
        <span className="text-[13px] text-muted">Group progress {pct}%</span>
      </div>
    </button>
  )
}

export function SupportedCard({ goal: s, onCheer }: { goal: SupportedGoal; onCheer: () => void }) {
  const pct = Math.min(100, Math.round((s.saved / s.target) * 100))
  return (
    <div className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <Avatar initials={s.initials} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ada-dark">
            {s.person} · {s.goalName}
          </p>
          <p className="truncate text-[12.5px] text-muted">{s.streak}</p>
        </div>
        <button type="button" onClick={onCheer} className="h-[32px] shrink-0 rounded-full border-2 border-ada px-3 text-[13px] font-semibold text-ada active:bg-ada-soft">
          Cheer
        </button>
      </div>
      <Progress value={pct} />
      <div className="flex justify-between text-[12.5px] text-muted">
        <span>{GOAL_TYPE_LABEL[s.type]} · {s.role === 'saver' ? 'Saving together' : 'You support'}</span>
        <span className="font-semibold text-ada">{pct}%</span>
      </div>
    </div>
  )
}
