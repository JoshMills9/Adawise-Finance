// WiseBadges: the visible side of Adawise's incentives.
// Saver badges = 3/6/9/12-month milestones (fixed deposit + interest paid upfront).
// Partner badges = taking part as an accountability partner (partner incentives).
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADA_DARK, DetailHeader, HeartIcon, Progress, Sheet, card, goBack } from '../components/ada'
import { BadgeIcon, ChevronRight, LifebuoyIcon, LockIcon, UsersIcon, VaultIcon } from '../components/icons'
import { CheckCircle } from '../components/goalIcons'
import { ghs, shortDate, type Badge, type BadgeIconName } from '../lib/demoData'
import { useBadges, useGoals } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'

const ICONS: Record<BadgeIconName, (size: number) => ReactNode> = {
  milestone: (s) => <VaultIcon size={s} />,
  heart: (s) => <HeartIcon size={s} />,
  circle: (s) => <UsersIcon size={s} />,
  lifebuoy: (s) => <LifebuoyIcon size={s} />,
}

const pctOf = (b: Badge) => Math.min(100, Math.round((b.progress.now / b.progress.of) * 100))
const progressText = (b: Badge) => `${b.progress.now} of ${b.progress.of} ${b.progress.unit}`

export function Badges() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const badges = useBadges()
  const goals = useGoals()
  const [open, setOpen] = useState<Badge | null>(null)

  const saver = badges.filter((b) => b.group === 'saver')
  const partner = badges.filter((b) => b.group === 'partner')
  const earned = badges.filter((b) => b.earned).length
  const interest = goals.flatMap((g) => g.activity ?? []).filter((a) => a.kind === 'interest').reduce((t, a) => t + a.amount, 0)
  const next = saver.find((b) => !b.earned)

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(32px+env(safe-area-inset-bottom))]">
        <DetailHeader title="WiseBadges" onBack={() => goBack(navigate, '/adawise/profile')}>
          <div className="flex flex-col items-center px-6 pb-10 pt-2 text-center">
            <span className="grid size-[76px] place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
              <BadgeIcon size={44} />
            </span>
            <p className="mt-3 text-[30px] font-bold leading-none">
              {earned}
              <span className="text-[18px] font-medium text-white/70"> of {badges.length} earned</span>
            </p>
            <p className="mt-2 text-[14px] text-white/75">Interest paid upfront so far: {ghs(interest, 0)}</p>
          </div>
        </DetailHeader>

        {next && (
          <section className="px-4 pt-5">
            <h2 className="pb-3 text-[17px] font-bold text-ink">Next milestone</h2>
            <button type="button" onClick={() => setOpen(next)} className={`${card} flex w-full items-center gap-4 p-4 text-left`}>
              <Medal badge={next} size={56} />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold text-ada-dark">{next.name}</span>
                <span className="block text-[13px] text-muted">Fixed deposit + interest paid upfront</span>
                <Progress value={pctOf(next)} className="mb-[6px] mt-[10px]" />
                <span className="flex justify-between text-[12.5px] text-muted">
                  <span>{progressText(next)}</span>
                  <span className="font-semibold text-ada-dark">{pctOf(next)}%</span>
                </span>
              </span>
            </button>
          </section>
        )}

        <BadgeGroup
          title="Saver milestones"
          intro="Keep a goal going for 3, 6, 9 or 12 months. At each milestone, qualifying savings move into a fixed deposit and you get the interest upfront."
          badges={saver}
          cols="grid-cols-4 narrow:grid-cols-2"
          onOpen={setOpen}
        />
        <BadgeGroup
          title="Partner badges"
          intro="Earned by supporting other people's savings. Each one comes with a partner incentive."
          badges={partner}
          cols="grid-cols-3 narrow:grid-cols-2"
          onOpen={setOpen}
        />
      </main>

      <Sheet open={open !== null} onClose={() => setOpen(null)} label={open?.name ?? 'Badge'}>
        {open && (
          <BadgeDetail
            badge={open}
            onGoal={(id) => {
              setOpen(null)
              navigate(`/adawise/goal/${id}`)
            }}
            onClose={() => setOpen(null)}
          />
        )}
      </Sheet>
    </div>
  )
}

function BadgeGroup({ title, intro, badges, cols, onOpen }: { title: string; intro: string; badges: Badge[]; cols: string; onOpen: (b: Badge) => void }) {
  const done = badges.filter((b) => b.earned).length
  return (
    <section className="px-4 pt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold text-ink">{title}</h2>
        <span className="text-[13px] text-muted">
          {done} of {badges.length}
        </span>
      </div>
      <p className="pb-3 pt-1 text-[13px] leading-snug text-muted">{intro}</p>
      <div className={`grid gap-[10px] ${cols}`}>
        {badges.map((b) => (
          <button key={b.id} type="button" onClick={() => onOpen(b)} className={`${card} flex flex-col items-center px-1 pb-3 pt-4 text-center active:scale-[0.98]`}>
            <Medal badge={b} size={54} />
            <span className={`mt-2 text-[12.5px] font-bold leading-tight ${b.earned ? 'text-ada-dark' : 'text-muted'}`}>{b.name}</span>
            <span className="mt-1 text-[11.5px] text-muted">{b.earned ? (b.earnedOn ? shortDate(b.earnedOn) : 'Earned') : b.group === 'saver' ? `${pctOf(b)}%` : 'Not yet'}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** Earned: navy medal. Locked: grey medal with a teal progress ring and a small lock. Milestones show their month number. */
function Medal({ badge: b, size }: { badge: Badge; size: number }) {
  const inner = b.label ? (
    <span className="flex flex-col items-center leading-none">
      <span className="font-bold" style={{ fontSize: size * 0.36 }}>
        {b.label}
      </span>
      <span className="font-medium" style={{ fontSize: Math.max(9, size * 0.16) }}>
        months
      </span>
    </span>
  ) : (
    ICONS[b.icon](Math.round(size * 0.46))
  )

  if (b.earned) {
    return (
      <span
        className="relative grid shrink-0 place-items-center rounded-full bg-ada-dark text-white shadow-[0_4px_12px_rgba(18,33,47,0.25)] ring-4 ring-[#e6ebef]"
        style={{ width: size, height: size }}
      >
        {inner}
      </span>
    )
  }
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid shrink-0 place-items-center rounded-full bg-[#eef1f3] text-[#8a96a0]" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#dfe4e8" strokeWidth={stroke} fill="none" />
        {pctOf(b) > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#14b39f" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pctOf(b) / 100)} />
        )}
      </svg>
      {inner}
      <span className="absolute -right-[2px] -top-[2px] grid size-[20px] place-items-center rounded-full bg-white text-[#8a96a0] shadow-[0_1px_4px_rgba(0,0,0,0.12)]">
        <LockIcon size={12} />
      </span>
    </span>
  )
}

function BadgeDetail({ badge: b, onGoal, onClose }: { badge: Badge; onGoal: (id: string) => void; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <Medal badge={b} size={88} />
      <h2 className="mt-4 text-[22px] font-bold text-ada-dark">{b.name}</h2>
      <p className="mt-1 text-[14.5px] text-muted">{b.how}</p>

      {b.earned ? (
        <p className="mt-4 flex items-center gap-2 rounded-full bg-ada-soft px-4 py-2 text-[14px] font-semibold text-ada-dark">
          <CheckCircle size={18} className="text-ada" /> {b.earnedOn ? `Earned on ${shortDate(b.earnedOn)}` : 'Earned'}
        </p>
      ) : (
        <div className="mt-4 w-full rounded-[16px] bg-[#f4f6f7] p-4 text-left">
          <div className="flex justify-between text-[13.5px]">
            <span className="text-muted">{b.group === 'saver' ? 'Your longest-running goal' : 'Your progress'}</span>
            <span className="font-semibold text-ada-dark">{progressText(b)}</span>
          </div>
          <Progress value={pctOf(b)} className="mt-[10px]" />
        </div>
      )}

      <div className="mt-3 w-full rounded-[16px] border border-[#e6ebec] p-4 text-left">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.04em] text-muted">Incentive</p>
        <p className="mt-1 text-[14.5px] text-ink">{b.reward}</p>
      </div>

      {b.goals && b.goals.length > 0 && (
        <div className="mt-3 w-full divide-y divide-[#eef0f1] overflow-hidden rounded-[16px] border border-[#e6ebec] text-left">
          {b.goals.map((g) => (
            <button key={g.id} type="button" onClick={() => onGoal(g.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 active:bg-[#f7f9f9]">
              <span className="text-[14.5px] font-semibold text-ada-dark">{g.name}</span>
              <span className="flex items-center gap-2 text-[13px] text-muted">
                {g.interest > 0 ? `${ghs(g.interest, 0)} interest` : 'Reached'}
                <span className="text-dot">
                  <ChevronRight size={16} />
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={onClose} className="mt-6 h-[50px] w-full rounded-full bg-ada text-[16px] font-semibold text-white active:brightness-110">
        {b.earned ? 'Nice!' : 'Keep going'}
      </button>
    </div>
  )
}
