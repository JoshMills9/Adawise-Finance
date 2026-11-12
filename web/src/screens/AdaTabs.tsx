// Adawise bottom tabs (Home, Goals, Circles, Profile) and the Goals, Circles and Profile tab screens.
import { useState, type ComponentType, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ADA_DARK, Chip, DEMO_NAME, DEMO_WALLET } from '../components/ada'
import { ChevronRight, FlagIcon, HomeIcon, PlusIcon, ProfileIcon, SearchIcon, UsersIcon } from '../components/icons'
import { GOAL_TYPE_LABEL, SHOW_PARTNER_SIDE, creditLeft, circleProgress, ghs, totals, type Frequency, type GoalType } from '../lib/demoData'
import { useBadges, useCircles, useGoals, useRequests, useSaveMe, useSupporting, useUnreadCount } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'
import { CircleCard, GoalCard } from './Adawise'

type Icon = ComponentType<{ size?: number }>

export const ADA_TABS: { to: string; label: string; icon: Icon }[] = [
  { to: '/adawise', label: 'Home', icon: HomeIcon },
  { to: '/adawise/goals', label: 'Goals', icon: FlagIcon },
  { to: '/adawise/circles', label: 'Circles', icon: UsersIcon },
  { to: '/adawise/profile', label: 'Profile', icon: ProfileIcon },
]
export const isAdaTab = (path: string) => ADA_TABS.some((t) => t.to === path)

/** Space to leave under scrolling content so the tab bar doesn't cover it */
export const TAB_BAR_SPACE = 'pb-[calc(92px+env(safe-area-inset-bottom))]'

export function AdaTabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="Adawise"
      className="absolute inset-x-0 bottom-0 z-20 rounded-t-[20px] bg-white pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="flex">
        {ADA_TABS.map(({ to, label, icon: I }) => {
          const active = pathname === to
          return (
            <button
              key={to}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => !active && navigate(to, { replace: true })}
              className={`relative flex flex-1 flex-col items-center gap-[4px] pt-[12px] ${active ? 'text-ada-dark' : 'text-[#8a96a0]'}`}
            >
              {active && <span className="absolute top-0 h-[3px] w-[28px] rounded-full bg-ada" />}
              <I size={24} />
              <span className={`text-[12.5px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/* ---------- shared tab layout ---------- */

function TabHeader({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <header
      className="ada-card-gradient shrink-0 px-4 pb-12 pt-[calc(env(safe-area-inset-top)+32px)] text-white"
      style={{ borderBottomLeftRadius: '50% 22px', borderBottomRightRadius: '50% 22px' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold leading-tight">{title}</h1>
          <p className="mt-[2px] truncate text-[13.5px] text-white/75">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </header>
  )
}

function CreateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[40px] shrink-0 items-center gap-1 rounded-full bg-ada pl-3 pr-4 text-[14px] font-semibold text-white active:brightness-110"
    >
      <PlusIcon size={18} />
      {label}
    </button>
  )
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="mt-6 flex h-[46px] items-center gap-2 rounded-[14px] bg-white px-3 text-muted">
      <SearchIcon size={20} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-full w-full min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-[#8a96a0] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="shrink-0 text-[13px] font-semibold text-ada">
          Clear
        </button>
      )}
    </label>
  )
}

function FilterRow<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-3 [scrollbar-width:none]">
      {options.map((o) => (
        <span key={o.id} className="shrink-0">
          <Chip selected={value === o.id} onClick={() => onChange(o.id)}>
            {o.label}
          </Chip>
        </span>
      ))}
    </div>
  )
}

function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-[14px] text-muted">{text}</p>
      {action}
    </div>
  )
}

function TabScreen({ children }: { children: ReactNode }) {
  useThemeColor(ADA_DARK)
  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className={`min-h-0 flex-1 overflow-y-auto ${TAB_BAR_SPACE}`}>{children}</main>
      <AdaTabBar />
    </div>
  )
}

const matches = (name: string, q: string) => name.toLowerCase().includes(q.trim().toLowerCase())

/* ---------- Goals tab ---------- */

type GoalFilter = 'all' | GoalType | 'shared'

export function GoalsTab() {
  const navigate = useNavigate()
  const goals = useGoals()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<GoalFilter>('all')
  const create = () => navigate('/adawise/new-goal')

  const count = (f: GoalFilter) => goals.filter((g) => (f === 'all' ? true : f === 'shared' ? !!g.partners?.length : g.type === f)).length
  const shown = goals.filter(
    (g) => matches(g.name, q) && (filter === 'all' || (filter === 'shared' ? !!g.partners?.length : g.type === filter)),
  )
  const { total } = totals(goals)

  return (
    <TabScreen>
      <TabHeader title="My goals" subtitle={`${goals.length} goal${goals.length === 1 ? '' : 's'} · ${ghs(total)} saved`} action={<CreateButton label="New goal" onClick={create} />}>
        <SearchBar value={q} onChange={setQ} placeholder="Search goals" />
      </TabHeader>
      <FilterRow
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'all', label: `All (${count('all')})` },
          { id: 'flexible', label: `${GOAL_TYPE_LABEL.flexible} (${count('flexible')})` },
          { id: 'goal-locked', label: `${GOAL_TYPE_LABEL['goal-locked']} (${count('goal-locked')})` },
          { id: 'time-locked', label: `${GOAL_TYPE_LABEL['time-locked']} (${count('time-locked')})` },
          { id: 'shared', label: `With partners (${count('shared')})` },
        ]}
      />
      <div className="flex flex-col gap-3 px-4">
        {shown.map((g) => (
          <GoalCard key={g.id} goal={g} money={(n) => ghs(n)} onClick={() => navigate(`/adawise/goal/${g.id}`)} />
        ))}
        {shown.length === 0 &&
          (goals.length === 0 ? (
            <Empty text="You haven't set any goals yet." action={<CreateButton label="Create a goal" onClick={create} />} />
          ) : (
            <Empty text={q ? `No goals match "${q.trim()}".` : 'No goals in this group yet.'} />
          ))}
      </div>
    </TabScreen>
  )
}

/* ---------- Circles tab ---------- */

type CircleFilter = 'all' | Frequency | 'done'

export function CirclesTab() {
  const navigate = useNavigate()
  const circles = useCircles()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<CircleFilter>('all')
  const create = () => navigate('/adawise/new-circle')

  const inGroup = (f: CircleFilter, c: (typeof circles)[number]) => (f === 'all' ? true : f === 'done' ? circleProgress(c) >= 100 : c.frequency === f)
  const count = (f: CircleFilter) => circles.filter((c) => inGroup(f, c)).length
  const shown = circles.filter((c) => matches(c.name, q) && inGroup(filter, c))
  const members = circles.reduce((s, c) => s + c.members.length, 0)

  return (
    <TabScreen>
      <TabHeader
        title="My circles"
        subtitle={`${circles.length} WiseCircle${circles.length === 1 ? '' : 's'} · ${members} members`}
        action={<CreateButton label="New circle" onClick={create} />}
      >
        <SearchBar value={q} onChange={setQ} placeholder="Search circles" />
      </TabHeader>
      <FilterRow
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'all', label: `All (${count('all')})` },
          { id: 'daily', label: `Daily (${count('daily')})` },
          { id: 'weekly', label: `Weekly (${count('weekly')})` },
          { id: 'monthly', label: `Monthly (${count('monthly')})` },
          { id: 'done', label: `Completed (${count('done')})` },
        ]}
      />
      <div className="flex flex-col gap-3 px-4">
        {shown.map((c) => (
          <CircleCard key={c.id} circle={c} onClick={() => navigate(`/adawise/circle/${c.id}`)} />
        ))}
        {shown.length === 0 &&
          (circles.length === 0 ? (
            <Empty text="Save together with friends and family." action={<CreateButton label="Create a circle" onClick={create} />} />
          ) : (
            <Empty text={q ? `No circles match "${q.trim()}".` : 'No circles in this group yet.'} />
          ))}
      </div>
    </TabScreen>
  )
}

/* ---------- Profile tab ---------- */

export function ProfileTab() {
  const navigate = useNavigate()
  const goals = useGoals()
  const circles = useCircles()
  const supporting = useSupporting()
  const saveMe = useSaveMe()
  const unread = useUnreadCount()
  const pending = useRequests().filter((r) => r.status === 'pending').length
  const badges = useBadges()
  const owed = goals.reduce((t, g) => t + (g.credit ? creditLeft(g.credit) : 0), 0)
  const earnedBadges = badges.filter((b) => b.earned).length
  const { total } = totals(goals)
  const initials = DEMO_NAME.split(' ')
    .map((w) => w[0])
    .join('')

  return (
    <TabScreen>
      <header
        className="ada-card-gradient shrink-0 px-4 pb-8 pt-[calc(env(safe-area-inset-top)+24px)] text-center text-white"
        style={{ borderBottomLeftRadius: '50% 22px', borderBottomRightRadius: '50% 22px' }}
      >
        <span className="mx-auto grid size-[72px] place-items-center rounded-full bg-white text-[24px] font-bold text-ada-dark">{initials}</span>
        <h1 className="mt-3 text-[22px] font-bold">{DEMO_NAME}</h1>
        <p className="mt-[2px] text-[14px] tracking-[0.04em] text-white/75">MoMo wallet {DEMO_WALLET}</p>
      </header>

      <section className="mx-4 -mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] bg-[#eef0f1] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Stat label="Total saved" value={ghs(total, 0)} />
        <Stat label="WiseBadges" value={String(earnedBadges)} onClick={() => navigate('/adawise/badges')} />
        <Stat label="Goals" value={String(goals.length)} />
        <Stat label="Circles" value={String(circles.length)} />
      </section>

      <section className="mx-4 mt-4 divide-y divide-[#eef0f1] overflow-hidden rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Row label="WiseBadges" note={`${earnedBadges} of ${badges.length} earned`} onClick={() => navigate('/adawise/badges')} />
        {SHOW_PARTNER_SIDE && (
          <>
            <Row label="Requests for you" note={pending ? `${pending} new` : 'All caught up'} onClick={() => navigate('/adawise/requests')} />
            <Row label="Goals you support" note={`${supporting.length}`} onClick={() => navigate('/adawise/supporting')} />
          </>
        )}
        <Row label="Save Me loan" note={owed > 0 ? `${ghs(owed, 0)} to repay` : 'Nothing owed'} onClick={() => navigate('/adawise/loan')} />
        <Row label="Next contributions" onClick={() => navigate('/adawise/contributions')} />
        <Row label="Notifications" note={unread ? `${unread} unread` : undefined} onClick={() => navigate('/adawise/notifications')} />
      </section>

      <section className="mx-4 mt-4 divide-y divide-[#eef0f1] overflow-hidden rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Row label="Save Me" note={`${saveMe.left} of ${saveMe.allowed} left this year`} />
        <Row label="Back to MoMo" onClick={() => navigate('/home', { replace: true })} />
      </section>
    </TabScreen>
  )
}

function Stat({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  const body = (
    <>
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className="mt-[2px] flex items-center justify-between gap-2 truncate text-[18px] font-bold text-ada-dark">
        {value}
        {onClick && (
          <span className="text-dot">
            <ChevronRight size={16} />
          </span>
        )}
      </p>
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className="bg-white px-4 py-[14px] text-left active:bg-[#f7f9f9]">
      {body}
    </button>
  ) : (
    <div className="bg-white px-4 py-[14px]">{body}</div>
  )
}

function Row({ label, note, onClick }: { label: string; note?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="text-[15px] font-semibold text-ada-dark">{label}</span>
      <span className="flex shrink-0 items-center gap-2 text-[13px] text-muted">
        {note}
        {onClick && (
          <span className="text-dot">
            <ChevronRight size={18} />
          </span>
        )}
      </span>
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 px-4 py-[15px] text-left active:bg-[#f7f9f9]">
      {body}
    </button>
  ) : (
    <div className="flex items-center justify-between gap-3 px-4 py-[15px]">{body}</div>
  )
}
