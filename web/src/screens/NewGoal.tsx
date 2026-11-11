import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ClockIcon, DropletIcon, LockIcon, UsersIcon } from '../components/icons'
import { GOAL_TYPE_LABEL, MAX_PARTNERS, ghs, type Frequency, type Goal, type GoalType } from '../lib/demoData'
import { goalStore } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'
import {
  ADA_DARK,
  Check,
  Chip,
  EditLink,
  Field,
  HeartIcon,
  IconButton,
  Note,
  Option,
  PaymentSheet,
  PeriodChips,
  PrimaryButton,
  ReviewRow,
  StepBar,
  StepTitle,
  SuccessRow,
  ToggleRow,
  goBack,
  type Icon,
} from '../components/ada'
import { FREQUENCIES, addMonths, amountOf, cleanAmount, contribution, firstName, initials, iso, longDate, nextDue, todayIso, uid } from '../lib/format'

const STEPS = ['Goal', 'Type', 'Plan', 'Partner', 'Review'] as const
const DEMO_WALLET = '241 234 567'

type Role = 'saver' | 'supporter'
type DraftPartner = { name: string; phone: string; role: Role | null }
type Draft = {
  emoji: string
  name: string
  target: string
  type: GoalType | null
  months: number
  frequency: Frequency
  autoSave: boolean
  reminders: boolean
  partners: DraftPartner[]
  deposit: string
}

const SUGGESTIONS = [
  { emoji: '💻', name: 'Laptop' },
  { emoji: '🏠', name: 'Rent' },
  { emoji: '🎓', name: 'School fees' },
  { emoji: '🚑', name: 'Emergency' },
  { emoji: '💼', name: 'Business' },
  { emoji: '✈️', name: 'Travel' },
]

const CONTACTS = [
  { name: 'Kofi Asante', phone: '024 412 3456' },
  { name: 'Esi Boateng', phone: '020 198 7654' },
  { name: 'Yaw Mensah', phone: '055 422 2333' },
  { name: 'Akosua Owusu', phone: '027 744 4555' },
]

const TYPES: { id: GoalType; icon: Icon; title: string; desc: string; rule: string }[] = [
  {
    id: 'flexible',
    icon: DropletIcon,
    title: 'Flexible',
    desc: 'Save at your own pace without locking your money away.',
    rule: 'Withdraw anytime',
  },
  {
    id: 'goal-locked',
    icon: LockIcon,
    title: 'Goal-locked',
    desc: 'Stay committed. Your money stays locked until you hit your target.',
    rule: 'Unlocks when you reach your target',
  },
  {
    id: 'time-locked',
    icon: ClockIcon,
    title: 'Time-locked',
    desc: 'Lock your savings for a set period. Keep adding money any time.',
    rule: 'Unlocks when the period ends',
  },
]

/* ---------- screen ---------- */

export function NewGoal() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [paying, setPaying] = useState(false)
  const [created, setCreated] = useState<Goal | null>(null)
  const [d, setD] = useState<Draft>({
    emoji: '🎯',
    name: '',
    target: '',
    type: null,
    months: 6,
    frequency: 'weekly',
    autoSave: true,
    reminders: true,
    partners: [],
    deposit: '',
  })
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }))
  // Back to wherever the flow was opened from; Adawise home if opened directly
  const exit = () => goBack(navigate)

  const target = amountOf(d.target)
  const deposit = amountOf(d.deposit)
  const perPeriod = useMemo(() => contribution(target, d.months, d.frequency), [target, d.months, d.frequency])
  const freqLabel = FREQUENCIES.find((f) => f.id === d.frequency)!

  const valid = [
    d.name.trim().length >= 2 && target >= 10,
    d.type !== null,
    d.months > 0,
    d.partners.every((p) => p.name.trim().length > 0 && p.role !== null),
    deposit <= target,
  ][step]

  const go = (to: number) => {
    setDir(to > step ? 1 : -1)
    setStep(to)
  }
  const back = () => (step === 0 ? exit() : go(step - 1))

  const create = () => {
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      name: d.name.trim(),
      emoji: d.emoji,
      type: d.type!,
      saved: deposit,
      target,
      createdAt: todayIso(),
      activity: deposit > 0 ? [{ id: uid('a'), kind: 'deposit', amount: deposit, date: todayIso(), note: 'First deposit' }] : [],
      unlockDate: d.type === 'time-locked' ? iso(addMonths(d.months)) : undefined,
      partners: d.partners.length
        ? d.partners.map((p) => ({ name: firstName(p.name), initials: initials(p.name), role: p.role!, status: 'invited' as const }))
        : undefined,
      nextContribution: { amount: perPeriod, due: nextDue(d.frequency) },
      plan: { frequency: d.frequency, months: d.months, amount: perPeriod, autoSave: d.autoSave, reminders: d.reminders },
    }
    goalStore.add(goal)
    setCreated(goal)
  }

  if (created) return <Success goal={created} deposit={deposit} onDone={exit} />

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      {/* Top bar */}
      <header className="ada-card-gradient shrink-0 pt-[env(safe-area-inset-top)] text-white">
        <div className="flex h-[60px] items-center justify-between px-2">
          <IconButton label="Back" onClick={back}>
            <path d="M15 4 7 12l8 8" />
          </IconButton>
          <h1 className="text-[17px] font-semibold">New goal</h1>
          <IconButton label="Close" onClick={exit}>
            <path d="M5 5l14 14M19 5 5 19" />
          </IconButton>
        </div>
        <StepBar steps={STEPS} step={step} />
      </header>

      {/* Step content */}
      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: 28 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 * dir }}
            transition={{ duration: 0.18 }}
            className="px-4 pb-6 pt-5"
          >
            {step === 0 && <StepGoal d={d} set={set} />}
            {step === 1 && <StepType d={d} set={set} target={target} />}
            {step === 2 && <StepPlan d={d} set={set} perPeriod={perPeriod} per={freqLabel.per} />}
            {step === 3 && <StepPartner d={d} set={set} />}
            {step === 4 && <StepReview d={d} set={set} target={target} perPeriod={perPeriod} per={freqLabel.per} goTo={go} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-[#e6ebec] bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <PrimaryButton
          disabled={!valid}
          onClick={() => {
            if (step < STEPS.length - 1) go(step + 1)
            else if (deposit > 0) setPaying(true)
            else create()
          }}
        >
          {step === STEPS.length - 1 ? (deposit > 0 ? `Create goal & pay ${ghs(deposit)}` : 'Create goal') : 'Continue'}
        </PrimaryButton>
        {step === 3 && (
          <button
            type="button"
            onClick={() => {
              set({ partners: [] })
              go(4)
            }}
            className="mt-1 h-[44px] w-full text-[15px] font-semibold text-ada active:opacity-60"
          >
            Skip for now
          </button>
        )}
      </div>

      <PaymentSheet
        open={paying}
        amount={deposit}
        goalName={d.name.trim()}
        onCancel={() => setPaying(false)}
        onApproved={() => {
          setPaying(false)
          create()
        }}
      />
    </div>
  )
}

/* ---------- steps ---------- */

function StepGoal({ d, set }: { d: Draft; set: (p: Partial<Draft>) => void }) {
  return (
    <>
      <StepTitle title="What are you saving for?" subtitle="Give your goal a name and a target amount." />

      <div className="mt-5 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Chip key={s.name} selected={d.name === s.name} onClick={() => set({ name: s.name, emoji: s.emoji })}>
            <span className="mr-1">{s.emoji}</span>
            {s.name}
          </Chip>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Field
          label="Goal name"
          placeholder="e.g. New laptop"
          maxLength={30}
          value={d.name}
          onChange={(e) => set({ name: e.target.value })}
          prefix={<span className="text-[20px]">{d.emoji}</span>}
        />
        <Field
          label="Target amount"
          placeholder="0.00"
          inputMode="decimal"
          value={d.target}
          onChange={(e) => set({ target: cleanAmount(e.target.value) })}
          prefix="GHS"
          hint="Minimum GHS 10"
        />
      </div>
    </>
  )
}

function StepType({ d, set, target }: { d: Draft; set: (p: Partial<Draft>) => void; target: number }) {
  return (
    <>
      <StepTitle title="How do you want to save?" subtitle="Choose how strict your goal should be. You can't change this later." />
      <div className="mt-5 flex flex-col gap-3">
        {TYPES.map((t) => (
          <Option
            key={t.id}
            selected={d.type === t.id}
            onClick={() => set({ type: t.id })}
            icon={t.icon}
            title={t.title}
            desc={t.desc}
            meta={t.id === 'goal-locked' && target > 0 ? `Unlocks at ${ghs(target, 0)}` : t.rule}
          />
        ))}
      </div>

      <AnimatePresence>
        {d.type === 'time-locked' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p className="mt-6 text-[14px] font-semibold text-ada-dark">Lock my savings for</p>
            <PeriodChips value={d.months} onChange={(m) => set({ months: m })} />
            <p className="mt-2 text-[13px] text-muted">Unlocks on {longDate(addMonths(d.months))}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Note>Savings you keep for 3, 6, 9 or 12 months reach a milestone and can earn interest, paid upfront.</Note>
    </>
  )
}

function StepPlan({ d, set, perPeriod, per }: { d: Draft; set: (p: Partial<Draft>) => void; perPeriod: number; per: string }) {
  const lockedPeriod = d.type === 'time-locked'
  return (
    <>
      <StepTitle title="Set your saving plan" subtitle="We'll work out how much to put aside so you reach your goal on time." />

      <p className="mt-6 text-[14px] font-semibold text-ada-dark">Reach my goal in</p>
      <PeriodChips value={d.months} onChange={(m) => set({ months: m })} disabled={lockedPeriod} />
      {lockedPeriod && <p className="mt-2 text-[13px] text-muted">Matches your lock period</p>}

      <p className="mt-6 text-[14px] font-semibold text-ada-dark">How often will you save?</p>
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-full bg-[#e6ebec] p-1">
        {FREQUENCIES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => set({ frequency: f.id })}
            className={`h-[38px] rounded-full text-[14px] font-semibold transition ${
              d.frequency === f.id ? 'bg-white text-ada-dark shadow-[0_1px_4px_rgba(0,0,0,0.12)]' : 'text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="ada-card-gradient mt-5 rounded-[18px] p-5 text-white">
        <p className="text-[13px] text-white/70">You'll save</p>
        <p className="mt-1 text-[30px] font-bold leading-tight">
          {ghs(perPeriod, 0)}
          <span className="text-[16px] font-medium text-white/70"> / {per}</span>
        </p>
        <p className="mt-1 text-[13px] text-white/70">
          for {d.months} months · done by {longDate(addMonths(d.months))}
        </p>
      </div>

      <div className="mt-4 divide-y divide-[#eef0f1] rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <ToggleRow
          title="Auto-save from MoMo"
          desc={`Move ${ghs(perPeriod, 0)} every ${per} from your wallet`}
          on={d.autoSave}
          onChange={(v) => set({ autoSave: v })}
        />
        <ToggleRow title="Reminders" desc="Get a nudge before each saving day" on={d.reminders} onChange={(v) => set({ reminders: v })} />
      </div>
    </>
  )
}

function StepPartner({ d, set }: { d: Draft; set: (p: Partial<Draft>) => void }) {
  const [manual, setManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const roleRef = useRef<HTMLDivElement>(null)
  const list = d.partners
  const full = list.length >= MAX_PARTNERS

  // When a partner is added, scroll so their role choice is visible
  const prevCount = useRef(list.length)
  useEffect(() => {
    if (list.length > prevCount.current) {
      requestAnimationFrame(() => {
        const el = roleRef.current
        const box = el?.closest('.overflow-y-auto')
        if (!el || !box) return
        const top = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 12
        box.scrollTo({ top, behavior: 'smooth' })
      })
    }
    prevCount.current = list.length
  }, [list.length])

  const has = (name: string) => list.some((p) => p.name === name)
  const toggle = (name: string, phone: string) =>
    has(name) ? set({ partners: list.filter((p) => p.name !== name) }) : !full && set({ partners: [...list, { name, phone, role: null }] })
  const update = (name: string, patch: Partial<DraftPartner>) =>
    set({ partners: list.map((p) => (p.name === name ? { ...p, ...patch } : p)) })

  const manualOk = manualName.trim().length > 0 && manualPhone.replace(/\D/g, '').length >= 9 && !has(manualName.trim()) && !full
  const addManual = () => {
    if (!manualOk) return
    set({ partners: [...list, { name: manualName.trim(), phone: manualPhone, role: null }] })
    setManualName('')
    setManualPhone('')
    setManual(false)
  }

  return (
    <>
      <StepTitle
        title="Add accountability partners"
        subtitle={`Add up to ${MAX_PARTNERS} people you trust to keep you on track. Optional, but you're more likely to succeed.`}
      />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-[14px] font-semibold text-ada-dark">Choose contacts</p>
        <span className={`rounded-full px-2 py-[2px] text-[12px] font-semibold ${full ? 'bg-ada text-white' : 'bg-[#e6ebec] text-muted'}`}>
          {list.length} of {MAX_PARTNERS} added
        </span>
      </div>
      <div className="mt-2 divide-y divide-[#eef0f1] overflow-hidden rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {CONTACTS.map((c) => {
          const on = has(c.name)
          const blocked = full && !on
          return (
            <button
              key={c.name}
              type="button"
              aria-pressed={on}
              disabled={blocked}
              onClick={() => toggle(c.name, c.phone)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${blocked ? 'opacity-40' : ''}`}
            >
              <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-ada-soft text-[13px] font-bold text-ada-dark">{initials(c.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">{c.name}</span>
                <span className="block text-[13px] text-muted">{c.phone}</span>
              </span>
              <Check on={on} />
            </button>
          )
        })}
        <button
          type="button"
          disabled={full}
          onClick={() => setManual((m) => !m)}
          className="w-full px-4 py-3 text-left text-[14px] font-semibold text-ada disabled:text-[#a3adae]"
        >
          + Enter a number instead
        </button>
      </div>
      {full && <p className="mt-2 text-[12.5px] text-muted">You've added the maximum of {MAX_PARTNERS} partners. Remove one to choose someone else.</p>}

      {manual && !full && (
        <div className="mt-3 flex flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <Field label="Partner's name" placeholder="e.g. Ama" value={manualName} onChange={(e) => setManualName(e.target.value.slice(0, 30))} />
          <Field
            label="MoMo number"
            placeholder="24 000 0000"
            inputMode="tel"
            prefix="+233"
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 12))}
          />
          <button
            type="button"
            disabled={!manualOk}
            onClick={addManual}
            className="h-[46px] rounded-full border-2 border-ada text-[15px] font-semibold text-ada transition disabled:border-[#c5d0d1] disabled:text-[#a3adae]"
          >
            Add partner
          </button>
        </div>
      )}

      {list.length > 0 && (
        <div ref={roleRef}>
          <p className="mt-6 text-[14px] font-semibold text-ada-dark">How will {list.length === 1 ? 'they' : 'each partner'} take part?</p>
          <div className="mt-2 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {list.map((p) => (
                <motion.div
                  key={p.name}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-[36px] shrink-0 place-items-center rounded-full bg-ada-soft text-[12.5px] font-bold text-ada-dark">{initials(p.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{p.name}</span>
                      <span className="block text-[12.5px] text-muted">{p.phone}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => set({ partners: list.filter((x) => x.name !== p.name) })}
                      className="grid size-8 place-items-center rounded-full text-muted active:bg-[#eef2f4]"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <RoleButton on={p.role === 'saver'} icon={UsersIcon} label="Save with me" onClick={() => update(p.name, { role: 'saver' })} />
                    <RoleButton on={p.role === 'supporter'} icon={HeartIcon} label="Cheer me on" onClick={() => update(p.name, { role: 'supporter' })} />
                  </div>
                  <p className="mt-2 text-[12.5px] leading-snug text-muted">
                    {p.role === 'saver'
                      ? `${firstName(p.name)} saves towards their own goal alongside you in a WiseCircle.`
                      : p.role === 'supporter'
                        ? `${firstName(p.name)} gets your progress updates, cheers you on and can help through Save Me.`
                        : 'Choose a role to continue.'}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <Note>Partners can see your progress but can never withdraw or control your money.</Note>
    </>
  )
}

function RoleButton({ on, icon: I, label, onClick }: { on: boolean; icon: Icon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex h-[44px] items-center justify-center gap-2 rounded-[12px] border-2 text-[14px] font-semibold transition ${
        on ? 'border-ada bg-ada text-white' : 'border-[#d5dedf] bg-white text-ada-dark'
      }`}
    >
      <I size={18} />
      {label}
    </button>
  )
}

function StepReview({
  d,
  set,
  target,
  perPeriod,
  per,
  goTo,
}: {
  d: Draft
  set: (p: Partial<Draft>) => void
  target: number
  perPeriod: number
  per: string
  goTo: (s: number) => void
}) {
  const unlock =
    d.type === 'flexible' ? 'Anytime' : d.type === 'goal-locked' ? `When you reach ${ghs(target, 0)}` : longDate(addMonths(d.months))
  const quick = [...new Set([perPeriod, 50, 100])].filter((n) => n <= target)

  return (
    <>
      <StepTitle title="Review your goal" subtitle="Check the details, then add a first deposit if you like." />

      <div className="mt-5 rounded-[18px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3 border-b border-[#eef0f1] p-4">
          <span className="grid size-[46px] place-items-center rounded-[14px] bg-ada-soft text-[24px]">{d.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-bold text-ada-dark">{d.name.trim()}</p>
            <p className="text-[14px] text-muted">Target {ghs(target)}</p>
          </div>
          <EditLink onClick={() => goTo(0)} />
        </div>
        <ReviewRow label="Type" value={GOAL_TYPE_LABEL[d.type!]} onEdit={() => goTo(1)} />
        <ReviewRow label="Unlocks" value={unlock} />
        <ReviewRow label="Plan" value={`${ghs(perPeriod, 0)} / ${per} for ${d.months} months`} onEdit={() => goTo(2)} />
        <ReviewRow label="Auto-save" value={d.autoSave ? 'On' : 'Off'} />
        <ReviewRow
          label={d.partners.length > 1 ? 'Partners' : 'Partner'}
          value={
            d.partners.length
              ? d.partners.map((p) => `${firstName(p.name)} (${p.role === 'saver' ? 'saving with you' : 'supporter'})`).join(', ')
              : 'None'
          }
          onEdit={() => goTo(3)}
          last
        />
      </div>

      <p className="mt-6 text-[14px] font-semibold text-ada-dark">First deposit (optional)</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Chip selected={!amountOf(d.deposit)} onClick={() => set({ deposit: '' })}>
          Later
        </Chip>
        {quick.map((n) => (
          <Chip key={n} selected={amountOf(d.deposit) === n} onClick={() => set({ deposit: String(n) })}>
            {ghs(n, 0)}
          </Chip>
        ))}
      </div>
      <div className="mt-3">
        <Field
          label="Or enter an amount"
          placeholder="0.00"
          inputMode="decimal"
          prefix="GHS"
          value={d.deposit}
          onChange={(e) => set({ deposit: cleanAmount(e.target.value) })}
          hint={amountOf(d.deposit) > target ? "Can't be more than your target" : `From MoMo wallet ${DEMO_WALLET}`}
          error={amountOf(d.deposit) > target}
        />
      </div>
    </>
  )
}

/* ---------- success ---------- */

function Success({ goal, deposit, onDone }: { goal: Goal; deposit: number; onDone: () => void }) {
  return (
    <div className="font-ada ada-card-gradient flex h-full flex-col text-white">
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="grid size-[96px] place-items-center rounded-full bg-ada shadow-[0_0_0_12px_rgba(20,179,159,0.18)]"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.4 }} />
          </svg>
        </motion.span>

        <h1 className="mt-8 text-[26px] font-bold">Your goal is set!</h1>
        <p className="mt-2 text-[16px] text-white/80">
          {goal.emoji} {goal.name} · {GOAL_TYPE_LABEL[goal.type]}
        </p>

        <div className="mt-8 w-full divide-y divide-white/10 rounded-[18px] bg-white/8 text-left ring-1 ring-white/10">
          {deposit > 0 && <SuccessRow text={`First deposit of ${ghs(deposit)} received`} />}
          <SuccessRow text={`Next saving: ${ghs(goal.plan!.amount, 0)} on ${new Date(goal.nextContribution!.due + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`} />
          {goal.partners?.map((p) => (
            <SuccessRow key={p.name} text={`Invite sent to ${p.name} to ${p.role === 'saver' ? 'save with you in a WiseCircle' : 'cheer you on'}`} />
          ))}
        </div>
      </div>

      <div className="px-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <PrimaryButton onClick={onDone}>Go to my goals</PrimaryButton>
      </div>
    </div>
  )
}

