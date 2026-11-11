import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/ui'
import { PlusIcon } from '../components/icons'
import { ADA_DARK, Avatar, Check, DetailHeader, MoneySheet, PrimaryButton, Progress, Ring, SectionTitle, Sheet, Tag, card, goBack } from '../components/ada'
import { CONTACTS, MAX_CIRCLE_MEMBERS, circleProgress, ghs, memberPct, shortDate, type Circle } from '../lib/demoData'
import { addMonths, contribution, firstName, initials, longDate, perLabel } from '../lib/format'
import { circleStore, noticeStore, useCircle } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'
import { Glyph, TrophyIcon } from '../components/goalIcons'

export function CircleDetail() {
  useThemeColor(ADA_DARK)
  const { id } = useParams()
  const circle = useCircle(id)
  const navigate = useNavigate()
  const [toast, toastNode] = useToast()
  const [adding, setAdding] = useState(false)
  const [inviting, setInviting] = useState(false)
  const back = () => goBack(navigate)

  if (!circle) {
    return (
      <div className="font-ada flex h-full flex-col items-center justify-center gap-4 bg-[#f4f6f7] px-8 text-center">
        <p className="text-[18px] font-bold text-ada-dark">This circle doesn't exist anymore</p>
        <div className="w-full max-w-[240px]">
          <PrimaryButton onClick={back}>Back to Adawise</PrimaryButton>
        </div>
      </div>
    )
  }

  const group = circleProgress(circle)
  const active = circle.members.filter((m) => m.status === 'active')
  const invited = circle.members.filter((m) => m.status === 'invited')
  const me = circle.members.find((m) => m.you)
  const per = perLabel(circle.frequency)
  const perPeriod = contribution(circle.targetPerMember, circle.months, circle.frequency)
  const ends = addMonths(circle.months, circle.createdAt)
  const ranked = [...active].sort((a, b) => b.saved - a.saved)
  const showValue = (saved: number, you?: boolean) => (circle.showAmounts || you ? ghs(saved, 0) : `${Math.min(100, Math.round((saved / circle.targetPerMember) * 100))}%`)

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(32px+env(safe-area-inset-bottom))]">
        <DetailHeader title="WiseCircle" onBack={back}>
          <div className="flex flex-col items-center px-6 pb-[64px] pt-1 text-center">
            <p className="flex items-center gap-2 text-[20px] font-bold">
              <Glyph name={circle.icon} size={22} /> {circle.name}
            </p>
            <p className="mt-1 text-[13px] text-white/70">
              {active.length} member{active.length === 1 ? '' : 's'}
              {invited.length ? ` · ${invited.length} invited` : ''} · ends {longDate(ends)}
            </p>
            <div className="mt-5">
              <Ring value={group}>
                <div>
                  <p className="text-[34px] font-bold leading-none">{group}%</p>
                  <p className="mt-1 text-[12.5px] text-white/70">group progress</p>
                </div>
              </Ring>
            </div>
            <div className="mt-4 flex -space-x-[6px]">
              {circle.members.slice(0, 6).map((m) => (
                <Avatar key={m.name} initials={m.initials} size={32} ring dark={m.you} />
              ))}
            </div>
          </div>
        </DetailHeader>

        <div className="px-4">
          {/* Your part */}
          {me && (
            <div className={`${card} relative -mt-[44px] p-4`}>
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-muted">Your savings</p>
                <Tag tone="teal">{memberPct(circle, me)}%</Tag>
              </div>
              <p className="mt-1 text-[24px] font-bold text-ada-dark">
                {ghs(me.saved)} <span className="whitespace-nowrap text-[14px] font-medium text-muted narrow:block">of {ghs(circle.targetPerMember, 0)}</span>
              </p>
              <Progress value={memberPct(circle, me)} />
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-[13px] text-muted">
                  <span className="whitespace-nowrap">Plan: {ghs(perPeriod, 0)} / {per}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="flex h-[38px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-ada px-4 narrow:px-3 text-[14px] font-semibold text-white active:brightness-110"
                >
                  <PlusIcon size={16} /> Add money
                </button>
              </div>
            </div>
          )}

          {/* Members */}
          <SectionTitle
            title="Members"
            action={<span className="text-[13px] text-muted">{circle.showAmounts ? 'Amounts visible' : '% progress only'}</span>}
          />
          <div className={`${card} divide-y divide-[#eef0f1]`}>
            {ranked.map((m, i) => {
              const pct = memberPct(circle, m)
              const behind = !m.you && pct < group
              return (
                <div key={m.name} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-[16px] text-center text-[13px] font-bold text-muted">{i + 1}</span>
                    <Avatar initials={m.initials} size={36} dark={m.you} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-ink">
                        {m.you ? 'You' : m.name}
                        {i === 0 && pct > 0 && <TrophyIcon size={15} className="ml-1 inline-block align-[-2px] text-ada" />}
                      </p>
                      <Progress value={pct} className="mt-[6px]" />
                    </div>
                    <div className="w-[74px] shrink-0 text-right">
                      <p className="text-[14px] font-bold text-ink">{showValue(m.saved, m.you)}</p>
                      {behind && (
                        <button
                          type="button"
                          onClick={() => {
                            circleStore.log(circle.id, `You nudged ${m.name}`)
                            toast(`Nudge sent to ${m.name}`)
                          }}
                          className="text-[12.5px] font-semibold text-ada"
                        >
                          Nudge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {invited.map((m) => (
              <div key={m.name} className="flex items-center gap-3 px-4 py-3">
                <span className="w-[16px]" />
                <Avatar initials={m.initials} size={36} />
                <p className="min-w-0 flex-1 text-[15px] font-semibold text-muted">{m.name}</p>
                <button
                  type="button"
                  title="Demo: pretend they joined"
                  onClick={() => {
                    circleStore.update(circle.id, (c) => ({ ...c, members: c.members.map((x) => (x.name === m.name ? { ...x, status: 'active' } : x)) }))
                    circleStore.log(circle.id, `${m.name} joined the circle`)
                    noticeStore.push({ kind: 'circle', text: `${m.name} joined ${circle.name}`, link: `/adawise/circle/${circle.id}` })
                  }}
                  className="text-right"
                >
                  <Tag tone="amber">Invited</Tag>
                  <span className="mt-1 block text-[11.5px] font-semibold text-ada">Simulate join</span>
                </button>
              </div>
            ))}
            {circle.members.length < MAX_CIRCLE_MEMBERS && (
              <button type="button" onClick={() => setInviting(true)} className="w-full px-4 py-3 text-left text-[14px] font-semibold text-ada">
                + Invite more people
              </button>
            )}
          </div>

          {/* How it works */}
          <SectionTitle title="Circle rules" />
          <div className={`${card} p-4`}>
            <ul className="flex flex-col gap-2 text-[14px] leading-snug text-ink">
              <Rule>
                Everyone saves towards their own <b>{ghs(circle.targetPerMember, 0)}</b> by {longDate(ends)}.
              </Rule>
              <Rule>
                Suggested plan: <b>{ghs(perPeriod, 0)}</b> every {per}.
              </Rule>
              <Rule>Each person owns their savings. No one can touch anyone else's money.</Rule>
              <Rule>{circle.showAmounts ? 'Members can see how much each person has saved.' : 'Members only see each other’s % progress, not amounts.'}</Rule>
            </ul>
          </div>

          {/* Activity */}
          <SectionTitle title="Activity" />
          <div className={`${card} divide-y divide-[#eef0f1]`}>
            {circle.activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span className="size-[8px] shrink-0 rounded-full bg-ada" />
                <p className="min-w-0 flex-1 text-[14px] text-ink">{a.text}</p>
                <span className="shrink-0 text-[12.5px] text-muted">{shortDate(a.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MoneySheet
        open={adding}
        mode="deposit"
        title="Add to your circle savings"
        to={circle.name}
        suggestions={[...new Set([perPeriod, 50, 100])]}
        onClose={() => setAdding(false)}
        onDone={(amt) => {
          circleStore.update(circle.id, (c) => ({ ...c, members: c.members.map((m) => (m.you ? { ...m, saved: m.saved + amt } : m)) }))
          circleStore.log(circle.id, `You saved ${ghs(amt)}`)
          setAdding(false)
          toast(`${ghs(amt)} added to ${circle.name}`)
        }}
      />
      <InviteSheet open={inviting} circle={circle} onClose={() => setInviting(false)} onToast={toast} />
      {toastNode}
    </div>
  )
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-[7px] size-[6px] shrink-0 rounded-full bg-ada" />
      <span>{children}</span>
    </li>
  )
}

function InviteSheet({ open, circle, onClose, onToast }: { open: boolean; circle: Circle; onClose: () => void; onToast: (m: string) => void }) {
  const [picked, setPicked] = useState<string[]>([])
  const taken = new Set(circle.members.map((m) => m.name))
  const options = CONTACTS.filter((c) => !taken.has(firstName(c.name)))
  const room = MAX_CIRCLE_MEMBERS - circle.members.length
  const close = () => {
    onClose()
    setTimeout(() => setPicked([]), 300)
  }
  const send = () => {
    circleStore.update(circle.id, (c) => ({
      ...c,
      members: [...c.members, ...picked.map((n) => ({ name: firstName(n), initials: initials(n), saved: 0, status: 'invited' as const }))],
    }))
    const names = picked.map(firstName).join(', ')
    circleStore.log(circle.id, `You invited ${names}`)
    onToast(`Invites sent to ${names}`)
    close()
  }
  return (
    <Sheet open={open} onClose={close} label="Invite people">
      <h2 className="mt-4 text-[20px] font-bold text-ada-dark">Invite people</h2>
      <p className="mt-1 text-[14px] text-muted">
        {room} spot{room === 1 ? '' : 's'} left in {circle.name}
      </p>
      <div className={`${card} mt-4 divide-y divide-[#eef0f1]`}>
        {options.length === 0 && <p className="px-4 py-6 text-center text-[14px] text-muted">All your contacts are already in this circle.</p>}
        {options.map((c) => {
          const on = picked.includes(c.name)
          const full = !on && picked.length >= room
          return (
            <button
              key={c.name}
              type="button"
              disabled={full}
              onClick={() => setPicked((p) => (on ? p.filter((x) => x !== c.name) : [...p, c.name]))}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left ${full ? 'opacity-40' : ''}`}
            >
              <Avatar initials={initials(c.name)} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">{c.name}</span>
                <span className="block text-[12.5px] text-muted">{c.phone}</span>
              </span>
              <Check on={on} />
            </button>
          )
        })}
      </div>
      <div className="mt-5">
        <PrimaryButton disabled={!picked.length} onClick={send}>
          {picked.length ? `Invite ${picked.length}` : 'Choose people'}
        </PrimaryButton>
      </div>
    </Sheet>
  )
}
