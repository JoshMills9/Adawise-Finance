import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui'
import {
  BadgeIcon,
  BellIcon,
  CashOutIcon,
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
  SHOW_PARTNER_SIDE,

  GOAL_TYPE_LABEL,
  INTEREST_EARNED,
  circleProgress,
  ghs,
  shortDate,
  totals,
  type Circle,
  type Goal,
  type SupportedGoal,
  withdrawRule,
} from '../lib/demoData'
import { useThemeColor } from '../lib/useThemeColor'
import { Glyph } from '../components/goalIcons'
import { ACTIVITY_LIMIT, EmptyState, HeartIcon, MoneySheet, Radio, Sheet, PrimaryButton, ShowAllToggle } from '../components/ada'
import { AdaTabBar, TAB_BAR_SPACE } from './AdaTabs'
import { contributeToGoal, depositToWallet, errorText, refreshAdawise, withdrawFromGoal, withdrawFromWallet } from '../lib/adawise'
import { noticeStore, useBadges, useCircles, useGoals, useRequests, useSaveMe, useSupporting, useUnreadCount, useWallet, type WalletEntry } from "../lib/goalStore"

const ADA_DARK = '#12212F'

type Icon = ComponentType<{ size?: number }>
/** Max items per list on the Adawise home; the arrows open the full lists */
const HOME_LIMIT = 3
/** The swipeable highlight cards (Save Me left, fixed deposits, WiseBadges, circles) */
const SHOW_HIGHLIGHTS = false

/** Adawise home tab: wallet card (Save / Withdraw) → quick actions → next contributions → recent activity */
export function Adawise() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const [toast, toastNode] = useToast()
  const [hidden, setHidden] = useState(false)
  const goals = useGoals()
  const circles = useCircles()
  const saveMe = useSaveMe()
  const badges = useBadges()
  const unread = useUnreadCount()
  const pending = useRequests().filter((r) => r.status === 'pending')
  const supporting = useSupporting()
  const pendingInvites = pending.filter((r) => r.kind === 'invite').length
  const pendingSaveMe = pending.filter((r) => r.kind === 'saveme').length
  const wallet = useWallet()
  const [paying, setPaying] = useState<Goal | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [source, setSource] = useState<WithdrawSource | null>(null)
  const [showAllActivity, setShowAllActivity] = useState(false)
  const computed = totals(goals)
  // The API's home totals (wallet included) win; until they load, work them out from the goals + wallet
  const total = wallet.summary?.total ?? computed.total + wallet.balance
  const locked = wallet.summary?.locked ?? computed.locked
  const available = wallet.summary?.available ?? computed.available + wallet.balance
  const canWithdraw = wallet.balance > 0 || goals.some((g) => g.saved > 0 && withdrawRule(g).allowed)
  const [depositing, setDepositing] = useState(false)
  const money = (n: number) => (hidden ? 'GHS ****' : ghs(n))
  const activity = recentActivity(goals, wallet.activity)
  const shownActivity = showAllActivity ? activity : activity.slice(0, ACTIVITY_LIMIT)

  useEffect(() => {
    refreshAdawise().catch((e) => toast(errorText(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className={`min-h-0 flex-1 overflow-y-auto ${TAB_BAR_SPACE}`}>
        {/* ---- Header + wallet, laid out like the MoMo home but in Adawise navy ---- */}
        <section className="relative">
          <div
            className="ada-card-gradient absolute inset-x-0 top-0 h-[calc(232px+env(safe-area-inset-top))]"
            style={{ borderBottomLeftRadius: '50% 22px', borderBottomRightRadius: '50% 22px' }}
          />

          <div className="relative flex items-center justify-between px-[14px] pt-[calc(env(safe-area-inset-top)+10px)]">
            <span className="grid size-11 place-items-center">
              <img src="/brand/adawise-logo.png" alt="Adawise" width={38} height={38} className="size-[38px] object-contain brightness-0 invert" />
            </span>
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
              <WalletIcon size={12} /> My savings
            </span>
            <button
              type="button"
              aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
              onClick={() => setHidden((h) => !h)}
              className="absolute right-[14px] top-[44px] text-ada-dark active:opacity-60"
            >
              {hidden ? <EyeIcon size={28} /> : <EyeOffIcon size={28} />}
            </button>

            <div className="px-4 pb-[12px] pt-[32px] text-center">
              <p className="text-[13px] text-muted">Total savings</p>
              <p className="mt-[2px] text-[27px] font-bold text-ada-dark">{money(total)}</p>
            </div>
            <div className="grid grid-cols-2 pb-[14px]">
              <div className="text-center">
                <p className="text-[12.5px] text-muted">Locked</p>
                <p className="mt-[2px] text-[16px] font-bold text-ada-dark">{money(locked)}</p>
              </div>
              <div className="border-l border-[#e6e6e6] text-center">
                <p className="text-[12.5px] text-muted">Available</p>
                <p className="mt-[2px] text-[16px] font-bold text-ada-dark">{money(available)}</p>
              </div>
            </div>
            {/* Action row, like the MoMo wallet card (one line tall) */}
            <div className="grid grid-cols-2 border-t border-[#e6e6e6]">
              <button
                type="button"
                onClick={() => setDepositing(true)}
                className="flex items-center justify-center gap-2 py-[18px] text-ada active:bg-[#f7f9f9]"
              >
                <PlusIcon size={22} />
                <span className="text-[14px] font-semibold">Deposit</span>
              </button>
              <button
                type="button"
                disabled={!canWithdraw}
                onClick={() => setWithdrawing(true)}
                className="flex items-center justify-center gap-2 border-l border-[#e6e6e6] py-[18px] text-ada active:bg-[#f7f9f9] disabled:text-[#a3adae] disabled:active:bg-transparent"
              >
                <CashOutIcon size={22} />
                <span className="text-[14px] font-semibold">Withdraw</span>
              </button>
            </div>
          </div>
        </section>

        {/* ---- Quick actions ---- */}
        <section className="grid grid-cols-2 gap-3 px-4 pt-4">
          <QuickAction icon={FlagIcon} title="Create goal" subtitle="On your own" onClick={() => navigate("/adawise/new-goal")} />
          <QuickAction icon={UsersIcon} title="Create circle" subtitle="With others" onClick={() => navigate("/adawise/new-circle")} />
        </section>

        {/* ---- Requests for you (invites + Save Me asks from people you support) ---- */}
        {SHOW_PARTNER_SIDE && (
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
                  <span className="block text-[12.5px] leading-snug text-muted">
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
                {pending.length > 0 && <span className="rounded-full bg-ada-soft px-2 py-[2px] text-[12px] font-semibold text-ada-dark">{pending.length} new</span>}
                <span className="text-dot">
                  <ChevronRight size={18} />
                </span>
              </span>
            </button>
        </section>
        )}

        {/* ---- Highlights (swipe) — hidden for now; set SHOW_HIGHLIGHTS to true to bring back ---- */}
        {SHOW_HIGHLIGHTS && (
        <section className="mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Highlight
            icon={LifebuoyIcon}
            image="save-me"
            label="Save Me left"
            value={`${saveMe.left} of ${saveMe.allowed}`}
            note="Resets 1 Jan"
            tone="from-[#12212f] to-[#2a4a63]"
          />
          <Highlight
            icon={VaultIcon}
            image="fixed-deposits"
            label="Fixed deposits"
            value={hidden ? 'GHS ****' : ghs(FIXED_DEPOSITS, 0)}
            note={`Interest earned ${ghs(INTEREST_EARNED, 0)}`}
            tone="from-[#0c1722] to-[#1f3a50]"
          />
          <Highlight icon={BadgeIcon} image="badges" label="WiseBadges" value={`${badges.filter((b) => b.earned).length} of ${badges.length}`} note="3, 6, 9 & 12-month milestones" tone="from-[#12212f] to-[#33566f]" onClick={() => navigate('/adawise/badges')} />
          <Highlight icon={UsersIcon} image="circles" label="Active circles" value={String(circles.length)} note="Growing" tone="from-[#12212f] to-[#264257]" />
        </section>
        )}

        {/* ---- Next contributions ---- */}
        <SectionHeader title="Next contributions" onMore={() => navigate('/adawise/contributions')} />
        {/* Compact list: one row per upcoming payment; tap a row for the goal, Pay to pay it here */}
        <section className="mx-4 divide-y divide-[#eef0f1] overflow-hidden rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {upcoming(goals)
            .slice(0, 3)
            .map((g) => (
              <ContributionRow key={g.id} goal={g} money={money} onOpen={() => navigate(`/adawise/goal/${g.id}`)} onPay={() => setPaying(g)} />
            ))}
          {upcoming(goals).length === 0 && (
            <EmptyState
              compact
              icon={<ClockIcon size={24} />}
              title="Nothing due"
              text={goals.length ? 'Goals with a saving plan show their next payment here.' : 'Create a goal with a saving plan and its payments show up here.'}
            />
          )}
        </section>

        {/* ---- Recent activity (all goals + Adawise wallet), expandable ---- */}
        <div className="mt-6 flex items-center justify-between px-4 pb-3">
          <h2 className="text-[19px] font-bold text-ink">Recent activity</h2>
        </div>
        <section className="mx-4 overflow-hidden rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="divide-y divide-[#eef0f1]">
            {shownActivity.map((a) => (
              <ActivityItem key={a.id} item={a} money={money} onOpen={a.goalId ? () => navigate(`/adawise/goal/${a.goalId}`) : undefined} />
            ))}
            {activity.length === 0 && (
              <EmptyState
                compact
                icon={<WalletIcon size={24} />}
                title="No activity yet"
                text="Deposits, savings and withdrawals will show up here."
                action={{ label: 'Make a deposit', onClick: () => setDepositing(true) }}
              />
            )}
          </div>
          <ShowAllToggle count={activity.length} open={showAllActivity} onToggle={() => setShowAllActivity((v) => !v)} />
        </section>

        {/* ---- Goals you support (you're their accountability partner) ---- */}
        {SHOW_PARTNER_SIDE && supporting.length > 0 && (
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
        to={paying?.name ?? ''}
        fixedAmount={paying?.nextContribution?.amount}
        run={(amt) => contributeToGoal(paying!.id, amt)}
        onClose={() => setPaying(null)}
        onDone={(amt) => {
          toast(`${ghs(amt)} saved to ${paying?.name}`)
          setPaying(null)
        }}
      />
      {/* Deposit: MoMo wallet → Adawise wallet (counts towards Available) */}
      <MoneySheet
        open={depositing}
        mode="deposit"
        title="Deposit"
        to="Wallet"
        suggestions={[50, 100, 200, 500]}
        run={depositToWallet}
        onClose={() => setDepositing(false)}
        onDone={(amt) => {
          toast(`${ghs(amt)} added to your Adawise wallet`)
          setDepositing(false)
        }}
      />
      {/* Withdraw: pick where the money comes from, then the usual withdraw flow */}
      <WithdrawSourceSheet
        open={withdrawing}
        goals={goals}
        walletBalance={wallet.balance}
        onClose={() => setWithdrawing(false)}
        onPick={(src) => {
          setWithdrawing(false)
          setSource(src)
        }}
      />
      <MoneySheet
        open={source !== null}
        mode="withdraw"
        title="Withdraw"
        to={source?.kind === 'goal' ? source.goal.name : 'Wallet'}
        max={source ? sourceAmount(source) : undefined}
        run={(amt) => (source?.kind === 'goal' ? withdrawFromGoal(source.goal.id, amt) : withdrawFromWallet(amt))}
        onClose={() => setSource(null)}
        onDone={(amt) => {
          toast(`${ghs(amt)} sent to your MoMo wallet`)
          setSource(null)
        }}
      />
      <AdaTabBar />
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
      className="flex items-center gap-3 rounded-[16px] bg-white p-3 text-left shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition active:scale-[0.98] narrow:flex-col narrow:items-start narrow:gap-2"
    >
      <span className="relative grid size-[44px] shrink-0 place-items-center rounded-[12px] bg-surface text-ink">
        <I size={24} />
        <span className="absolute -bottom-1 -right-1 grid size-[18px] place-items-center rounded-full bg-ink text-white ring-2 ring-white">
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
  onClick,
}: {
  icon: Icon
  image: string
  label: string
  value: string
  note: string
  tone: string
  onClick?: () => void
}) {
  const [photo, setPhoto] = useState(false)
  const Box = onClick ? 'button' : 'div'
  return (
    <Box
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`relative w-[62%] shrink-0 snap-start narrow:w-[80%] overflow-hidden rounded-[18px] bg-gradient-to-br ${tone} p-4 text-left text-white ${onClick ? 'active:scale-[0.98]' : ''}`}
    >
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
      <p className="relative mt-1 whitespace-nowrap text-[clamp(22px,7.4vw,28px)] font-bold leading-tight [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">{value}</p>
      <p className="relative mt-1 text-[13px] text-white/85">{note}</p>
    </Box>
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
        <span className="font-semibold text-ada-dark">{pct}%</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-[6px] text-[12.5px] text-muted">
        <span className="whitespace-nowrap">{unlock}</span>
        {g.partners?.length ? (
          <span className="flex min-w-0 max-w-full items-center gap-[6px]">
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

export function ContributionRow({ goal: g, money, onPay, onOpen }: { goal: Goal; money: (n: number) => string; onPay: () => void; onOpen?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-[14px] py-[12px]">
      {/* Tapping the row opens the goal; Pay stays a separate button */}
      <button type="button" onClick={onOpen} disabled={!onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70">
      <span className="grid size-[40px] shrink-0 place-items-center rounded-[12px] bg-surface text-ink">
        <Glyph name={g.icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-ada-dark">{g.name}</p>
        <p className="truncate text-[12.5px] text-muted">
          <span className="hidden narrow:inline">{money(g.nextContribution!.amount)} · </span>
          Due {shortDate(g.nextContribution!.due)}
          <span className="narrow:hidden"> · {g.partners?.some((p) => p.role === 'saver') ? 'Circle' : 'Personal'}</span>
        </p>
      </div>
      <p className="shrink-0 text-[15px] font-bold text-ink narrow:hidden">{money(g.nextContribution!.amount)}</p>
      </button>
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
          <p className="text-[15px] font-bold leading-snug text-ada-dark">
            {s.person} · {s.goalName}
          </p>
          <p className="truncate text-[12.5px] text-muted">{s.streak}</p>
        </div>
        <button type="button" onClick={onCheer} className="h-[32px] shrink-0 rounded-full border-2 border-ada px-3 text-[13px] narrow:px-2 font-semibold text-ada active:bg-ada-soft">
          Cheer
        </button>
      </div>
      <Progress value={pct} />
      <div className="flex justify-between text-[12.5px] text-muted">
        <span>{GOAL_TYPE_LABEL[s.type]} · {s.role === 'saver' ? 'Saving together' : 'You support'}</span>
        <span className="font-semibold text-ada-dark">{pct}%</span>
      </div>
    </div>
  )
}

/* ---------- withdraw ---------- */

type WithdrawSource = { kind: 'wallet'; amount: number } | { kind: 'goal'; goal: Goal }
const sourceAmount = (s: WithdrawSource) => (s.kind === 'goal' ? s.goal.saved : s.amount)

/** Where to withdraw from: the Adawise wallet, or any goal that's unlocked right now */
function WithdrawSourceSheet({
  open,
  goals,
  walletBalance,
  onClose,
  onPick,
}: {
  open: boolean
  goals: Goal[]
  walletBalance: number
  onClose: () => void
  onPick: (s: WithdrawSource) => void
}) {
  const [picked, setPicked] = useState<string>('')
  const unlocked = goals.filter((g) => g.saved > 0 && withdrawRule(g).allowed)
  const lockedCount = goals.filter((g) => g.saved > 0 && !withdrawRule(g).allowed).length
  const options: { id: string; title: string; sub: string; amount: number; src: WithdrawSource }[] = [
    ...(walletBalance > 0 ? [{ id: 'wallet', title: 'Adawise wallet', sub: 'Deposits and Save Me loans', amount: walletBalance, src: { kind: 'wallet', amount: walletBalance } as const }] : []),
    ...unlocked.map((g) => ({ id: g.id, title: g.name, sub: withdrawRule(g).reason, amount: g.saved, src: { kind: 'goal', goal: g } as const })),
  ]
  const choice = options.find((o) => o.id === picked)

  return (
    <Sheet
      open={open}
      onClose={() => {
        setPicked('')
        onClose()
      }}
      label="Withdraw"
    >
      <h2 className="mt-4 text-[20px] font-bold text-ada-dark">Withdraw to MoMo</h2>
      <p className="mt-1 text-[14px] text-muted">Choose where the money comes from.</p>

      {options.length ? (
        <div className="mt-4 divide-y divide-[#eef0f1] overflow-hidden rounded-[16px] border border-[#e6ebec]">
          {options.map((o) => (
            <button key={o.id} type="button" onClick={() => setPicked(o.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-[#f7f9f9]">
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ada-dark">{o.title}</span>
                <span className="block truncate text-[12.5px] text-muted">{o.sub}</span>
              </span>
              <span className="shrink-0 text-[14.5px] font-bold text-ink">{ghs(o.amount)}</span>
              <Radio on={picked === o.id} />
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-[16px] bg-[#f4f6f7] px-4 py-6 text-center text-[14px] text-muted">Nothing to withdraw right now. Your goals are still locked.</p>
      )}
      {lockedCount > 0 && options.length > 0 && (
        <p className="mt-3 text-[12.5px] text-muted">
          {lockedCount} locked goal{lockedCount > 1 ? 's' : ''} can't be withdrawn until {lockedCount > 1 ? 'they unlock' : 'it unlocks'}.
        </p>
      )}

      <div className="mt-5">
        <PrimaryButton
          disabled={!choice}
          onClick={() => {
            if (!choice) return
            setPicked('')
            onPick(choice.src)
          }}
        >
          Continue
        </PrimaryButton>
      </div>
    </Sheet>
  )
}

/* ---------- recent activity ---------- */


type FeedItem = { id: string; date: string; title: string; sub: string; amount: number; sign: 1 | -1; icon: ReactNode; goalId?: string }

const FEED: Record<WalletEntry['kind'], { title: string; sign: 1 | -1; icon: ReactNode }> = {
  deposit: { title: 'Deposit', sign: 1, icon: <PlusIcon size={18} /> },
  withdrawal: { title: 'Withdrawal', sign: -1, icon: <CashOutIcon size={18} /> },
  rescue: { title: 'Save Me rescue', sign: 1, icon: <HeartIcon size={18} /> },
  interest: { title: 'Milestone interest', sign: 1, icon: <VaultIcon size={18} /> },
  credit: { title: 'Save Me loan', sign: 1, icon: <WalletIcon size={18} /> },
  repayment: { title: 'Loan repayment', sign: -1, icon: <VaultIcon size={18} /> },
}

/** The Adawise wallet's transactions (every goal movement passes through it), newest first */
function recentActivity(goals: Goal[], walletActivity: WalletEntry[]): FeedItem[] {
  const nameOf = (id?: string) => (id ? goals.find((g) => g.id === id)?.name : undefined)
  return walletActivity
    .map((w) => {
      const k = FEED[w.kind]
      const goal = nameOf(w.goalId)
      let sub = goal ?? 'Adawise wallet'
      if (w.kind === 'deposit') sub = goal ? (w.source === 'wallet' ? `${goal} · from Available` : goal) : 'From MoMo · to Available'
      else if (w.kind === 'withdrawal') sub = goal ? (w.to === 'wallet' ? `${goal} · to Available` : goal) : 'Adawise wallet · to MoMo'
      else if (w.kind === 'credit') sub = `${goal ?? 'Adawise wallet'} · to Available`
      return { id: w.id, date: w.date, title: k.title, sub, amount: w.amount, sign: k.sign, icon: k.icon, goalId: w.goalId }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

function ActivityItem({ item: a, money, onOpen }: { item: FeedItem; money: (n: number) => string; onOpen?: () => void }) {
  const out = a.sign < 0
  return (
    <button type="button" onClick={onOpen} disabled={!onOpen} className="flex w-full items-center gap-3 px-[14px] py-[12px] text-left active:bg-[#f7f9f9] disabled:active:bg-transparent">
      <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-surface text-ink">{a.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-ada-dark">{a.title}</span>
        <span className="block truncate text-[12.5px] text-muted">
          {a.sub} · {shortDate(a.date)}
        </span>
      </span>
      <span className={`shrink-0 text-[14.5px] font-bold ${out ? 'text-[#b93535]' : 'text-ada-dark'}`}>
        {out ? '−' : '+'}
        {money(a.amount)}
      </span>
    </button>
  )
}
