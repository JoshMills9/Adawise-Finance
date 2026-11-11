import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  ADA_DARK,
  Avatar,
  Check,
  Chip,
  ClosePath,
  BackPath,
  EditLink,
  Field,
  IconButton,
  Note,
  PaymentSheet,
  PeriodChips,
  PrimaryButton,
  ReviewRow,
  Segmented,
  StepBar,
  StepTitle,
  SuccessScreen,
  ToggleRow,
  card,
  goBack,
} from '../components/ada'
import { MAX_CIRCLE_MEMBERS, ghs, type Circle, type Frequency } from '../lib/demoData'
import { FREQUENCIES, addMonths, amountOf, cleanAmount, contribution, firstName, initials, longDate, perLabel, todayIso, uid } from '../lib/format'
import { circleStore } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'
import { Glyph } from '../components/goalIcons'

const STEPS = ['Circle', 'Goal', 'Members', 'Review'] as const

const IDEAS = [
  { icon: 'home', name: 'Hostel fund' },
  { icon: 'travel', name: 'Group trip' },
  { icon: 'school', name: 'School fees' },
  { icon: 'party', name: 'Celebration' },
  { icon: 'business', name: 'Business' },
  { icon: 'gift', name: 'Christmas' },
]

const CONTACTS = [
  { name: 'Kofi Asante', phone: '024 412 3456' },
  { name: 'Esi Boateng', phone: '020 198 7654' },
  { name: 'Yaw Mensah', phone: '055 422 2333' },
  { name: 'Akosua Owusu', phone: '027 744 4555' },
  { name: 'Ama Darko', phone: '024 555 1212' },
  { name: 'Kwame Ofori', phone: '050 333 9090' },
]

type Draft = {
  icon: string
  name: string
  target: string
  months: number
  frequency: Frequency
  members: { name: string; phone: string }[]
  showAmounts: boolean
  deposit: string
}

export function NewCircle() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [paying, setPaying] = useState(false)
  const [created, setCreated] = useState<Circle | null>(null)
  const [d, setD] = useState<Draft>({ icon: 'group', name: '', target: '', months: 6, frequency: 'weekly', members: [], showAmounts: false, deposit: '' })
  const set = (p: Partial<Draft>) => setD((prev) => ({ ...prev, ...p }))

  const target = amountOf(d.target)
  const deposit = amountOf(d.deposit)
  const perPeriod = useMemo(() => contribution(target, d.months, d.frequency), [target, d.months, d.frequency])
  const valid = [d.name.trim().length >= 2, target >= 10, d.members.length >= 1, deposit <= target][step]

  const go = (to: number) => {
    setDir(to > step ? 1 : -1)
    setStep(to)
  }
  const exit = () => goBack(navigate)

  const create = () => {
    const c: Circle = {
      id: uid('circle'),
      name: d.name.trim(),
      icon: d.icon,
      targetPerMember: target,
      months: d.months,
      frequency: d.frequency,
      createdAt: todayIso(),
      showAmounts: d.showAmounts,
      members: [
        { name: 'You', initials: 'YO', saved: deposit, status: 'active', you: true },
        ...d.members.map((m) => ({ name: firstName(m.name), initials: initials(m.name), saved: 0, status: 'invited' as const })),
      ],
      activity: [
        ...(deposit > 0 ? [{ id: uid('c'), text: `You saved ${ghs(deposit)} to start`, date: todayIso() }] : []),
        { id: uid('c'), text: `You created the circle and invited ${d.members.length}`, date: todayIso() },
      ],
    }
    circleStore.add(c)
    setCreated(c)
  }

  if (created) {
    return (
      <SuccessScreen
        title="Your circle is ready!"
        subtitle={created.name}
        rows={[
          `Invites sent to ${d.members.map((m) => firstName(m.name)).join(', ')}`,
          `Everyone saves towards their own ${ghs(target, 0)}`,
          ...(deposit > 0 ? [`Your first ${ghs(deposit)} is saved`] : []),
        ]}
        action="Open circle"
        onAction={() => navigate(`/adawise/circle/${created.id}`, { replace: true })}
      />
    )
  }

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <header className="ada-card-gradient shrink-0 pt-[env(safe-area-inset-top)] text-white">
        <div className="flex h-[60px] items-center justify-between px-2">
          <IconButton label="Back" onClick={() => (step === 0 ? exit() : go(step - 1))}>
            <BackPath />
          </IconButton>
          <h1 className="text-[17px] font-semibold">New circle</h1>
          <IconButton label="Close" onClick={exit}>
            <ClosePath />
          </IconButton>
        </div>
        <StepBar steps={STEPS} step={step} />
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 28 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 * dir }}
            transition={{ duration: 0.18 }}
            className="px-4 pb-6 pt-5"
          >
            {step === 0 && (
              <>
                <StepTitle title="Name your circle" subtitle="A WiseCircle is a group of people saving together, each towards their own goal." />
                <div className="mt-5 flex flex-wrap gap-2">
                  {IDEAS.map((i) => (
                    <Chip key={i.name} selected={d.name === i.name} onClick={() => set({ name: i.name, icon: i.icon })}>
                      <Glyph name={i.icon} size={17} className="mr-1 inline-block align-[-3px]" />
                      {i.name}
                    </Chip>
                  ))}
                </div>
                <div className="mt-5">
                  <Field
                    label="Circle name"
                    placeholder="e.g. Hostel fund"
                    maxLength={30}
                    value={d.name}
                    onChange={(e) => set({ name: e.target.value })}
                    prefix={<Glyph name={d.icon} size={22} className="text-ada" />}
                  />
                </div>
                <Note>Everyone owns their own savings. Members can see each other's progress, which keeps the whole group motivated.</Note>
              </>
            )}

            {step === 1 && (
              <>
                <StepTitle title="Set the goal" subtitle="Each member saves towards this amount on their own." />
                <div className="mt-5">
                  <Field
                    label="Target per member"
                    placeholder="0.00"
                    inputMode="decimal"
                    prefix="GHS"
                    value={d.target}
                    onChange={(e) => set({ target: cleanAmount(e.target.value) })}
                    hint="Minimum GHS 10"
                  />
                </div>
                <p className="mt-6 text-[14px] font-semibold text-ada-dark">Reach it in</p>
                <PeriodChips value={d.months} onChange={(m) => set({ months: m })} />
                <p className="mt-6 text-[14px] font-semibold text-ada-dark">How often will members save?</p>
                <Segmented value={d.frequency} options={FREQUENCIES.map((f) => ({ id: f.id, label: f.label }))} onChange={(f) => set({ frequency: f })} />
                {target >= 10 && (
                  <div className="ada-card-gradient mt-5 rounded-[18px] p-5 text-white">
                    <p className="text-[13px] text-white/70">Each member saves</p>
                    <p className="mt-1 text-[30px] font-bold leading-tight">
                      {ghs(perPeriod, 0)}
                      <span className="text-[16px] font-medium text-white/70"> / {perLabel(d.frequency)}</span>
                    </p>
                    <p className="mt-1 text-[13px] text-white/70">Circle ends {longDate(addMonths(d.months))}</p>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <StepTitle title="Invite members" subtitle={`Add the people you'll save with. Up to ${MAX_CIRCLE_MEMBERS - 1} people besides you.`} />
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-ada-dark">Contacts</p>
                  <span className="rounded-full bg-[#e6ebec] px-2 py-[2px] text-[12px] font-semibold text-muted">{d.members.length} invited</span>
                </div>
                <div className={`${card} mt-2 divide-y divide-[#eef0f1] overflow-hidden`}>
                  {CONTACTS.map((c) => {
                    const on = d.members.some((m) => m.name === c.name)
                    const full = d.members.length >= MAX_CIRCLE_MEMBERS - 1 && !on
                    return (
                      <button
                        key={c.name}
                        type="button"
                        disabled={full}
                        onClick={() => set({ members: on ? d.members.filter((m) => m.name !== c.name) : [...d.members, c] })}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left ${full ? 'opacity-40' : ''}`}
                      >
                        <Avatar initials={initials(c.name)} size={38} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold text-ink">{c.name}</span>
                          <span className="block text-[13px] text-muted">{c.phone}</span>
                        </span>
                        <Check on={on} />
                      </button>
                    )
                  })}
                </div>
                <div className={`${card} mt-4`}>
                  <ToggleRow
                    title="Show amounts to members"
                    desc={d.showAmounts ? 'Members see how much each person has saved' : 'Members only see each other’s % progress'}
                    on={d.showAmounts}
                    onChange={(v) => set({ showAmounts: v })}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <StepTitle title="Review your circle" subtitle="Check the details, then add your first saving if you like." />
                <div className={`${card} mt-5`}>
                  <div className="flex items-center gap-3 border-b border-[#eef0f1] p-4">
                    <span className="grid size-[46px] place-items-center rounded-[14px] bg-ada-soft text-ada">
            <Glyph name={d.icon} size={24} />
          </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[18px] font-bold text-ada-dark">{d.name.trim()}</p>
                      <p className="text-[14px] text-muted">{d.members.length + 1} members incl. you</p>
                    </div>
                    <EditLink onClick={() => go(0)} />
                  </div>
                  <ReviewRow label="Target" value={`${ghs(target, 0)} each`} onEdit={() => go(1)} />
                  <ReviewRow label="Plan" value={`${ghs(perPeriod, 0)} / ${perLabel(d.frequency)} for ${d.months} months`} />
                  <ReviewRow label="Ends" value={longDate(addMonths(d.months))} />
                  <ReviewRow label="Members" value={d.members.map((m) => firstName(m.name)).join(', ')} onEdit={() => go(2)} />
                  <ReviewRow label="Privacy" value={d.showAmounts ? 'Amounts visible' : '% progress only'} last />
                </div>

                <p className="mt-6 text-[14px] font-semibold text-ada-dark">Your first saving (optional)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip selected={!deposit} onClick={() => set({ deposit: '' })}>
                    Later
                  </Chip>
                  {[...new Set([perPeriod, 50, 100])]
                    .filter((n) => n <= target)
                    .map((n) => (
                      <Chip key={n} selected={deposit === n} onClick={() => set({ deposit: String(n) })}>
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
                    error={deposit > target}
                    hint={deposit > target ? "Can't be more than the target" : undefined}
                  />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-[#e6ebec] bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
        <PrimaryButton
          disabled={!valid}
          onClick={() => {
            if (step < STEPS.length - 1) go(step + 1)
            else if (deposit > 0) setPaying(true)
            else create()
          }}
        >
          {step === STEPS.length - 1 ? (deposit > 0 ? `Create circle & pay ${ghs(deposit)}` : 'Create circle') : 'Continue'}
        </PrimaryButton>
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
