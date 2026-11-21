// Emergency withdrawal (demo): pocket first, then one protected withdrawal per goal after a
// 24-hour cooling-off, with a reminder of progress, a top-up plan and an optional partner alert.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ADA_DARK, ConfirmSheet, Chip, Field, Note, PrimaryButton, Processing, Ring, SheetRow, SuccessScreen, ToggleRow, WithdrawPinStep, card, goBack } from '../components/ada'
import { useToast } from '../components/ui'
import { errorText } from '../lib/adawise'
import { ghs, goalPct, withdrawRule, type Goal } from '../lib/demoData'
import { EMERGENCY, cancelEmergency, declareEmergency, releaseEmergency, skipCoolingOff, useEmergencyState, usePocket, withdrawFromPocket, type Emergency } from '../lib/emergency'
import { amountOf, cleanAmount, longDate, perLabel } from '../lib/format'
import { useGoal } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'
import { FlowShell } from './Requests'

type Stage = 'amount' | 'progress' | 'partners' | 'review' | 'pin' | 'paying' | 'failed' | 'cooling' | 'release-pin' | 'releasing' | 'done' | 'pocket-done'

export function EmergencyWithdraw() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const { id } = useParams()
  const goal = useGoal(id)
  const state = useEmergencyState()
  const pocket = usePocket()
  const existing = id ? state.emergencies[id] : undefined
  const active = existing && existing.status !== 'cancelled' ? existing : undefined
  const back = () => goBack(navigate, id ? `/adawise/goal/${id}` : '/adawise')

  const [stage, setStage] = useState<Stage>(active?.status === 'cooling' ? 'cooling' : 'amount')
  const [value, setValue] = useState('')
  const [topUp, setTopUp] = useState<Emergency['topUp'] | null>(null)
  const [tell, setTell] = useState(false)
  const [error, setError] = useState('')

  if (!goal) {
    return (
      <FlowShell title="Emergency" onBack={back}>
        <p className="pt-10 text-center text-[15px] text-muted">This goal isn't available.</p>
      </FlowShell>
    )
  }

  const amount = amountOf(value)
  const fromPocket = Math.min(amount, pocket.balance)
  const fromGoal = Math.max(0, Math.round((amount - fromPocket) * 100) / 100)
  const partners = goal.partners ?? []
  const used = active?.status === 'released'

  // Once a goal's emergency withdrawal is used, only the pocket is left
  if (used && stage === 'amount' && pocket.balance <= 0) {
    return (
      <FlowShell title="Emergency" onBack={back}>
        <div className={`${card} p-5 text-center`}>
          <p className="text-[17px] font-bold text-ada-dark">You've used this goal's emergency withdrawal</p>
          <p className="mt-2 text-[14px] text-muted">
            It was released on {longDate(new Date(active.readyAt))}. Each goal has one. Your emergency pocket is empty right now; your safety slice will refill it.
          </p>
        </div>
      </FlowShell>
    )
  }

  /* ---------- 1. how much ---------- */
  if (stage === 'amount') {
    const goalCap = used ? 0 : goal.saved
    const tooMuch = amount > pocket.balance + goalCap
    return (
      <FlowShell
        title="I have an emergency"
        onBack={back}
        footer={
          <PrimaryButton disabled={amount <= 0 || tooMuch} onClick={() => setStage(fromGoal > 0 ? 'progress' : 'review')}>
            Continue
          </PrimaryButton>
        }
      >
        <h2 className="text-[20px] font-bold text-ada-dark">How much do you need?</h2>
        <p className="mt-1 text-[14px] text-muted">We'll use your emergency pocket first, so your goal stays as whole as possible.</p>
        <div className="mt-4">
          <Field
            label="Amount"
            prefix="GHS"
            placeholder="0.00"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(cleanAmount(e.target.value))}
            error={tooMuch}
            hint={tooMuch ? `You can take up to ${ghs(pocket.balance + goalCap)}` : undefined}
          />
        </div>
        <div className={`${card} mt-4 divide-y divide-[#eef0f1] text-[14px]`}>
          <SheetRow label="Emergency pocket" value={`${ghs(pocket.balance)} · instant`} />
          <SheetRow label={goal.name} value={used ? 'Emergency already used' : `${ghs(goal.saved)} · after ${EMERGENCY.coolingHours}h`} />
        </div>
        {amount > 0 && !tooMuch && (
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink">
            {fromGoal > 0
              ? `${ghs(fromPocket)} from your pocket now, and ${ghs(fromGoal)} from ${goal.name} after a ${EMERGENCY.coolingHours}-hour cooling-off.`
              : `Your pocket covers it. ${goal.name} isn't touched.`}
          </p>
        )}
      </FlowShell>
    )
  }

  /* ---------- 2. progress reminder + top-up plan ---------- */
  if (stage === 'progress') {
    const now = goalPct(goal)
    const after = goal.target > 0 ? Math.max(0, Math.round(((goal.saved - fromGoal) / goal.target) * 100)) : 0
    const f = goal.plan?.frequency ?? 'weekly'
    const per = perLabel(f)
    const options = [4, 8].map((periods) => ({ periods, extra: Math.ceil(fromGoal / periods) }))
    return (
      <FlowShell
        title="Before you decide"
        onBack={() => setStage('amount')}
        footer={<PrimaryButton onClick={() => setStage(partners.length ? 'partners' : 'review')}>Continue</PrimaryButton>}
      >
        <div className="ada-card-gradient flex flex-col items-center rounded-[18px] px-5 py-6 text-center text-white">
          <Ring value={now} size={132} stroke={11}>
            <span>
              <span className="block text-[28px] font-bold">{now}%</span>
              <span className="block text-[12px] text-white/70">of {ghs(goal.target, 0)}</span>
            </span>
          </Ring>
          <p className="mt-4 text-[16px] font-semibold">You're {now}% of the way to {goal.name}</p>
          <p className="mt-1 text-[14px] text-white/75">
            Taking {ghs(fromGoal)} leaves you at {after}%. You've got this, and you can rebuild it.
          </p>
        </div>

        <p className="mt-6 text-[14px] font-semibold text-ada-dark">Plan to top it back up</p>
        <div className="mt-2 flex flex-col gap-2">
          {options.map((o) => (
            <Chip key={o.periods} selected={topUp?.periods === o.periods} onClick={() => setTopUp(o)}>
              +{ghs(o.extra, 0)} a {per} for {o.periods} {per}s
            </Chip>
          ))}
          <Chip selected={topUp === undefined} onClick={() => setTopUp(undefined)}>
            Not now
          </Chip>
        </div>
        <Note>A declared emergency pauses your saving streak: missed savings won't count against you, and your WiseBadges stay.</Note>
        {goal.earnsInterest !== false && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">Demo: how an emergency withdrawal affects milestone interest that's already been paid is still being decided.</p>
        )}
      </FlowShell>
    )
  }

  /* ---------- 3. partners (status only) ---------- */
  if (stage === 'partners') {
    const names = partners.map((p) => p.name).join(' and ')
    return (
      <FlowShell title="Your partners" onBack={() => setStage('progress')} footer={<PrimaryButton onClick={() => setStage('review')}>Continue</PrimaryButton>}>
        <h2 className="text-[20px] font-bold text-ada-dark">Tell your partners?</h2>
        <p className="mt-1 text-[14px] text-muted">It's up to you. They only see that you had an emergency, never amounts.</p>
        <div className={`${card} mt-4`}>
          <ToggleRow title={`Tell ${names}`} desc="A short status update, no amounts" on={tell} onChange={setTell} />
        </div>
        {tell && (
          <div className="mt-3 rounded-[14px] bg-[#e9eef1] px-4 py-3 text-[13.5px] leading-relaxed text-ink">
            <span className="block text-[12px] font-semibold text-muted">What they'll see</span>
            "Your partner declared an emergency on {goal.name}. Their saving streak is paused for now."
          </div>
        )}
      </FlowShell>
    )
  }

  /* ---------- 4. review ---------- */
  if (stage === 'review') {
    return (
      <FlowShell
        title="Review"
        onBack={() => setStage(fromGoal > 0 ? (partners.length ? 'partners' : 'progress') : 'amount')}
        footer={<PrimaryButton onClick={() => setStage('pin')}>{fromGoal > 0 ? 'Declare emergency' : `Withdraw ${ghs(fromPocket)}`}</PrimaryButton>}
      >
        <p className="text-center text-[14px] text-muted">Emergency withdrawal to MoMo</p>
        <p className="mt-1 text-center text-[34px] font-bold text-ada-dark">{ghs(amount)}</p>
        <div className={`${card} mt-5 divide-y divide-[#eef0f1] text-[14px]`}>
          {fromPocket > 0 && <SheetRow label="From your pocket" value={`${ghs(fromPocket)} · now`} />}
          {fromGoal > 0 && <SheetRow label={`From ${goal.name}`} value={`${ghs(fromGoal)} · in ${EMERGENCY.coolingHours}h`} />}
          {fromGoal > 0 && <SheetRow label="Top-up plan" value={topUp ? `+${ghs(topUp.extra, 0)} × ${topUp.periods}` : 'Not now'} />}
          {fromGoal > 0 && partners.length > 0 && <SheetRow label="Partners" value={tell ? 'Told (no amounts)' : 'Not told'} />}
        </div>
        {fromGoal > 0 && (
          <Note>
            The {ghs(fromGoal)} from your goal waits {EMERGENCY.coolingHours} hours, so you have time to be sure. You can cancel any time before then. This is the one
            emergency withdrawal for {goal.name}.
          </Note>
        )}
      </FlowShell>
    )
  }

  /* ---------- 5. PIN, then pay the pocket part and start the cooling-off ---------- */
  if (stage === 'pin') {
    return (
      <FlowShell title="Confirm" onBack={() => setStage('review')}>
        <WithdrawPinStep
          subtitle={fromPocket > 0 ? `To send ${ghs(fromPocket)} from your pocket to MoMo` : `To declare an emergency on ${goal.name}`}
          onVerified={() => setStage('paying')}
          onCancel={() => setStage('review')}
        />
      </FlowShell>
    )
  }

  if (stage === 'paying') {
    return (
      <Paying
        run={async () => {
          if (fromPocket > 0) await withdrawFromPocket(fromPocket)
          if (fromGoal > 0) declareEmergency({ goalId: goal.id, amount: fromGoal, fromPocket, tellPartners: tell, topUp: topUp ?? undefined })
        }}
        onDone={() => setStage(fromGoal > 0 ? 'cooling' : 'pocket-done')}
        onFail={(e) => {
          setError(errorText(e))
          setStage('failed')
        }}
      />
    )
  }

  if (stage === 'failed') {
    return (
      <FlowShell title="Emergency" onBack={() => setStage('review')} footer={<PrimaryButton onClick={() => setStage('paying')}>Try again</PrimaryButton>}>
        <p className="pt-8 text-center text-[18px] font-bold text-ada-dark">That didn't go through</p>
        <p className="mt-2 text-center text-[14px] text-muted">{error}</p>
      </FlowShell>
    )
  }

  if (stage === 'pocket-done') {
    return (
      <SuccessScreen
        title="Money on its way"
        subtitle={`${ghs(fromPocket)} sent to your MoMo wallet`}
        rows={['Taken from your emergency pocket', `${goal.name} wasn't touched`, 'Your safety slice will refill the pocket']}
        action="Done"
        onAction={back}
      />
    )
  }

  /* ---------- 6. cooling-off ---------- */
  if (stage === 'cooling' && active?.status === 'cooling') {
    return <CoolingOff goal={goal} em={active} onBack={back} onRelease={() => setStage('release-pin')} />
  }

  if (stage === 'release-pin' && active) {
    return (
      <FlowShell title="Confirm" onBack={() => setStage('cooling')}>
        <WithdrawPinStep subtitle={`To withdraw ${ghs(active.amount)} from ${goal.name}`} onVerified={() => setStage('releasing')} onCancel={() => setStage('cooling')} />
      </FlowShell>
    )
  }

  if (stage === 'releasing' && active) {
    return (
      <Paying
        run={() => releaseEmergency(goal.id)}
        onDone={() => setStage('done')}
        onFail={(e) => {
          setError(errorText(e))
          setStage('cooling')
        }}
      />
    )
  }

  if (stage === 'done' && active) {
    return (
      <SuccessScreen
        title="Emergency withdrawal done"
        subtitle={`${ghs(active.amount)} from ${goal.name}`}
        rows={[
          'Your saving streak is paused. Your WiseBadges are safe',
          active.topUp ? `Top-up plan: +${ghs(active.topUp.extra, 0)} for ${active.topUp.periods} ${perLabel(goal.plan?.frequency ?? 'weekly')}s` : 'No top-up plan for now',
          ...(partners.length ? [active.tellPartners ? 'Your partners were told (no amounts)' : "Your partners weren't told"] : []),
          "Demo: the goal's money didn't move. The backend doesn't support emergency withdrawals yet",
        ]}
        action="Back to my goal"
        onAction={back}
      />
    )
  }

  // Anything else (e.g. an emergency cancelled elsewhere): start over
  return (
    <FlowShell title="Emergency" onBack={back}>
      <p className="pt-10 text-center text-[15px] text-muted">Nothing in progress for {goal.name}.</p>
    </FlowShell>
  )
}

/** Runs the money step once and reports back */
function Paying({ run, onDone, onFail }: { run: () => Promise<unknown>; onDone: () => void; onFail: (e: unknown) => void }) {
  useEffect(() => {
    let live = true
    run().then(
      () => live && onDone(),
      (e: unknown) => live && onFail(e),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <FlowShell title="Emergency" onBack={() => {}}>
      <Processing title="Working on it…" subtitle="Waiting for MoMo confirmation" />
    </FlowShell>
  )
}

function CoolingOff({ goal, em, onBack, onRelease }: { goal: Goal; em: Emergency; onBack: () => void; onRelease: () => void }) {
  const [toast, toastNode] = useToast()
  const [now, setNow] = useState(() => Date.now())
  const [cancelling, setCancelling] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, em.readyAt - now)
  const ready = left === 0
  const total = em.readyAt - em.declaredAt
  const h = Math.floor(left / 3_600_000)
  const m = Math.floor((left % 3_600_000) / 60_000)
  const s = Math.floor((left % 60_000) / 1000)
  const locked = !withdrawRule(goal).allowed

  return (
    <FlowShell
      title="Cooling-off"
      onBack={onBack}
      footer={
        <>
          <PrimaryButton disabled={!ready} onClick={onRelease}>
            {ready ? `Withdraw ${ghs(em.amount)}` : 'Available when the timer ends'}
          </PrimaryButton>
          {!ready && (
            <button type="button" onClick={() => skipCoolingOff(goal.id)} className="mt-1 h-[40px] w-full text-[14px] font-semibold text-ada active:opacity-60">
              Skip the wait (demo)
            </button>
          )}
          <button type="button" onClick={() => setCancelling(true)} className="h-[40px] w-full text-[14px] font-semibold text-[#c23a3a] active:opacity-60">
            Cancel emergency withdrawal
          </button>
        </>
      }
    >
      <div className="ada-card-gradient flex flex-col items-center rounded-[18px] px-5 py-6 text-center text-white">
        <Ring value={total > 0 ? ((total - left) / total) * 100 : 100} size={148} stroke={11}>
          <span>
            <span className="block text-[26px] font-bold tabular-nums">{ready ? 'Ready' : `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}</span>
            <span className="block text-[12px] text-white/70">{ready ? 'you can withdraw' : 'left to wait'}</span>
          </span>
        </Ring>
        <p className="mt-4 text-[16px] font-semibold">
          {ghs(em.amount)} from {goal.name}
        </p>
        <p className="mt-1 text-[14px] text-white/75">
          {ready ? 'Your cooling-off is over. Confirm with your PIN to withdraw.' : `We'll remind you when it's ready, on ${new Date(em.readyAt).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.`}
        </p>
      </div>
      <div className={`${card} mt-4 divide-y divide-[#eef0f1] text-[14px]`}>
        <SheetRow label="Goal progress" value={`${goalPct(goal)}% of ${ghs(goal.target, 0)}`} />
        {em.fromPocket > 0 && <SheetRow label="Already sent from pocket" value={ghs(em.fromPocket)} />}
        <SheetRow label="Top-up plan" value={em.topUp ? `+${ghs(em.topUp.extra, 0)} × ${em.topUp.periods}` : 'Not now'} />
      </div>
      <Note>Still sure? If things have settled, cancelling keeps {goal.name} whole{locked ? ' and locked' : ''}, and you keep this goal's emergency withdrawal for later.</Note>

      <ConfirmSheet
        open={cancelling}
        title="Cancel the emergency withdrawal?"
        text={`${ghs(em.amount)} stays in ${goal.name}. You keep this goal's one emergency withdrawal for later.`}
        confirmLabel="Cancel withdrawal"
        busyTitle="Cancelling…"
        run={async () => cancelEmergency(goal.id)}
        onClose={() => setCancelling(false)}
        onDone={() => {
          setCancelling(false)
          toast('Emergency withdrawal cancelled')
          setTimeout(onBack, 700)
        }}
      />
      {toastNode}
    </FlowShell>
  )
}
