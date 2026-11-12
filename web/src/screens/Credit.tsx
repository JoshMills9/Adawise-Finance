// Save Me credit: what you owe, when it's due, and paying it back.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADA_DARK, DEMO_WALLET, DetailHeader, Field, PrimaryButton, Processing, Progress, Radio, Sheet, SheetRow, card, goBack } from '../components/ada'
import { CheckCircle } from '../components/goalIcons'
import { VaultIcon } from '../components/icons'
import { useToast } from '../components/ui'
import { CREDIT, creditLeft, creditOwed, daysUntil, ghs, shortDate, type Goal } from '../lib/demoData'
import { amountOf, cleanAmount, longDate } from '../lib/format'
import { goalStore, useGoals, useWallet } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'

type Active = Goal & { credit: NonNullable<Goal['credit']> }

export function Credit() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const [toast, toastNode] = useToast()
  const goals = useGoals()
  const wallet = useWallet()
  const [repaying, setRepaying] = useState<Active | null>(null)

  const active = goals.filter((g): g is Active => !!g.credit).sort((a, b) => a.credit.due.localeCompare(b.credit.due))
  const owed = active.reduce((t, g) => t + creditLeft(g.credit), 0)
  const history = goals
    .flatMap((g) => (g.activity ?? []).filter((a) => a.kind === 'repayment').map((a) => ({ ...a, goalId: g.id, goalName: g.name })))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(32px+env(safe-area-inset-bottom))]">
        <DetailHeader title="Save Me loan" onBack={() => goBack(navigate, '/adawise/profile')}>
          <div className="px-6 pb-10 pt-2 text-center">
            <p className="text-[14px] text-white/75">{active.length ? 'Left to repay' : 'You owe nothing'}</p>
            <p className="mt-1 text-[32px] font-bold leading-tight">{ghs(owed)}</p>
            <p className="mt-1 text-[13.5px] text-white/75">
              {active.length
                ? `${active.length} active loan${active.length > 1 ? 's' : ''} · next due ${longDate(active[0]!.credit.due)}`
                : 'Loans against your fixed deposit show up here'}
            </p>
          </div>
        </DetailHeader>

        <section className="px-4 pt-5">
          {active.length > 0 ? (
            <>
              <h2 className="pb-3 text-[17px] font-bold text-ink">Active loans</h2>
              <div className="flex flex-col gap-3">
                {active.map((g) => (
                  <CreditCard key={g.id} goal={g} onRepay={() => setRepaying(g)} onOpen={() => navigate(`/adawise/goal/${g.id}`)} />
                ))}
              </div>
            </>
          ) : (
            <div className={`${card} flex flex-col items-center px-6 py-8 text-center`}>
              <span className="grid size-[56px] place-items-center rounded-full bg-ada-soft text-ada">
                <CheckCircle size={28} />
              </span>
              <p className="mt-3 text-[16px] font-bold text-ada-dark">No loan to repay</p>
              <p className="mt-1 text-[13.5px] leading-snug text-muted">
                Once a goal reaches its 3-month milestone, you can borrow against its fixed deposit from the goal's Save Me option.
              </p>
              <button type="button" onClick={() => navigate('/adawise/goals')} className="mt-4 text-[14px] font-semibold text-ada">
                Go to my goals
              </button>
            </div>
          )}
        </section>

        <section className="px-4 pt-6">
          <h2 className="pb-3 text-[17px] font-bold text-ink">How repayment works</h2>
          <div className={`${card} space-y-2 p-4 text-[13.5px] leading-snug text-ink`}>
            <p>You repay what you borrowed plus a {Math.round(CREDIT.feeRate * 100)}% fee within {CREDIT.months} months.</p>
            <p>Pay it all at once or in parts, from your MoMo wallet or from loan money you haven't spent yet.</p>
            <p>Your goal and fixed deposit keep growing while you repay.</p>
          </div>
        </section>

        {history.length > 0 && (
          <section className="px-4 pt-6">
            <h2 className="pb-3 text-[17px] font-bold text-ink">Repayments</h2>
            <div className={`${card} divide-y divide-[#eef0f1] overflow-hidden`}>
              {history.map((h) => (
                <button key={h.id} type="button" onClick={() => navigate(`/adawise/goal/${h.goalId}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-[#f7f9f9]">
                  <span className="grid size-[36px] shrink-0 place-items-center rounded-full bg-ada-soft text-ada">
                    <VaultIcon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-ada-dark">{h.goalName}</span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {h.note} · {shortDate(h.date)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[14.5px] font-bold text-ada-dark">{ghs(h.amount)}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <RepaySheet
        goal={repaying}
        walletBalance={wallet.balance}
        onClose={() => setRepaying(null)}
        onDone={(amt, cleared) => {
          toast(cleared ? `Loan on ${repaying?.name} fully repaid` : `${ghs(amt)} repaid`)
          setRepaying(null)
        }}
      />
      {toastNode}
    </div>
  )
}

function CreditCard({ goal: g, onRepay, onOpen }: { goal: Active; onRepay: () => void; onOpen: () => void }) {
  const owed = creditOwed(g.credit)
  const repaid = g.credit.repaid ?? 0
  const left = creditLeft(g.credit)
  const days = daysUntil(g.credit.due)
  const late = days < 0
  return (
    <div className={`${card} p-4`}>
      <button type="button" onClick={onOpen} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className="block truncate text-[16px] font-bold text-ada-dark">{g.name}</span>
          <span className="block text-[12.5px] text-muted">
            Borrowed {ghs(g.credit.amount)}
            {g.credit.takenOn ? ` on ${shortDate(g.credit.takenOn)}` : ''} · {Math.round(CREDIT.feeRate * 100)}% fee
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-[2px] text-[12px] font-semibold ${late ? 'bg-[#fdefef] text-[#b93535]' : days <= 14 ? 'bg-[#fff4d6] text-[#8a6300]' : 'bg-[#eef2f4] text-muted'}`}
        >
          {late ? `${-days} day${days === -1 ? '' : 's'} late` : days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} left`}
        </span>
      </button>

      <Progress value={(repaid / owed) * 100} className="mb-[8px] mt-[12px]" />
      <div className="flex justify-between text-[13px] text-muted">
        <span>
          <span className="font-semibold text-ink">{ghs(repaid)}</span> of {ghs(owed)} repaid
        </span>
        <span>Due {longDate(g.credit.due)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] bg-[#f4f6f7] px-4 py-3">
        <span>
          <span className="block text-[12.5px] text-muted">Left to repay</span>
          <span className="block text-[18px] font-bold text-ada-dark">{ghs(left)}</span>
        </span>
        <button type="button" onClick={onRepay} className="h-[40px] shrink-0 rounded-full bg-ada px-5 text-[14px] font-bold text-white active:brightness-110">
          Repay
        </button>
      </div>
    </div>
  )
}

/** Amount (full or part) → where it's paid from → confirm → processing */
function RepaySheet({ goal, walletBalance, onClose, onDone }: { goal: Active | null; walletBalance: number; onClose: () => void; onDone: (amount: number, cleared: boolean) => void }) {
  const [stage, setStage] = useState<'amount' | 'confirm' | 'processing'>('amount')
  const [value, setValue] = useState('')
  const [from, setFrom] = useState<'momo' | 'wallet'>('momo')
  const left = goal ? creditLeft(goal.credit) : 0

  useEffect(() => {
    if (!goal) return
    setStage('amount')
    setValue(String(creditLeft(goal.credit)))
    setFrom('momo')
  }, [goal])

  const amount = amountOf(value)
  const sourceMax = from === 'wallet' ? Math.min(walletBalance, left) : left
  const tooMuch = amount > sourceMax

  const finish = useRef<() => void>(() => {})
  finish.current = () => {
    if (!goal) return
    const cleared = goalStore.repayCredit(goal.id, amount, from)
    onDone(amount, cleared)
  }
  useEffect(() => {
    if (stage !== 'processing') return
    const t = setTimeout(() => finish.current(), 1500)
    return () => clearTimeout(t)
  }, [stage])

  return (
    <Sheet open={goal !== null} onClose={stage === 'processing' ? undefined : onClose} label="Repay loan">
      {goal && stage === 'amount' && (
        <>
          <h2 className="mt-4 text-[20px] font-bold text-ada-dark">Repay loan</h2>
          <p className="mt-1 text-[14px] text-muted">
            {goal.name} · {ghs(left)} left to repay
          </p>
          <div className="mt-4">
            <Field
              label="Amount"
              prefix="GHS"
              placeholder="0.00"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(cleanAmount(e.target.value))}
              error={tooMuch}
              hint={
                tooMuch
                  ? from === 'wallet' && walletBalance < left
                    ? `Your loan balance is ${ghs(walletBalance)}`
                    : `You only owe ${ghs(left)}`
                  : amount > 0 && amount < left
                    ? `${ghs(left - amount)} will be left after this`
                    : undefined
              }
            />
          </div>

          <p className="mt-5 text-[14px] font-semibold text-ada-dark">Pay from</p>
          <div className="mt-2 divide-y divide-[#eef0f1] overflow-hidden rounded-[16px] border border-[#e6ebec]">
            <SourceRow on={from === 'momo'} title="MoMo wallet" sub={DEMO_WALLET} onClick={() => setFrom('momo')} />
            {walletBalance > 0 && <SourceRow on={from === 'wallet'} title="Loan balance" sub={`${ghs(walletBalance)} unspent in your Adawise wallet`} onClick={() => setFrom('wallet')} />}
          </div>

          <div className="mt-5">
            <PrimaryButton disabled={amount <= 0 || tooMuch} onClick={() => setStage('confirm')}>
              Continue
            </PrimaryButton>
          </div>
        </>
      )}

      {goal && stage === 'confirm' && (
        <>
          <p className="mt-5 text-center text-[14px] text-muted">{amount >= left ? 'Repay in full' : 'Part repayment'}</p>
          <p className="mt-1 text-center text-[32px] font-bold text-ada-dark">{ghs(amount)}</p>
          <div className="mt-5 divide-y divide-[#eef0f1] rounded-[14px] bg-[#f4f6f7] text-[14px]">
            <SheetRow label="Loan" value={goal.name} />
            <SheetRow label="From" value={from === 'momo' ? `MoMo wallet ${DEMO_WALLET}` : 'Adawise loan balance'} />
            <SheetRow label="Left after" value={ghs(Math.max(0, left - amount))} />
          </div>
          <p className="mt-3 text-center text-[12.5px] text-muted">Demo only. No real money moves and no PIN is needed.</p>
          <div className="mt-4">
            <PrimaryButton onClick={() => setStage('processing')}>Confirm repayment</PrimaryButton>
          </div>
          <button type="button" onClick={() => setStage('amount')} className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted active:opacity-60">
            Back
          </button>
        </>
      )}

      {stage === 'processing' && <Processing title="Processing…" subtitle={from === 'momo' ? 'Waiting for MoMo confirmation' : 'Applying your loan balance'} />}
    </Sheet>
  )
}

function SourceRow({ on, title, sub, onClick }: { on: boolean; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-[#f7f9f9]">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ada-dark">{title}</span>
        <span className="block truncate text-[12.5px] text-muted">{sub}</span>
      </span>
      <Radio on={on} />
    </button>
  )
}
