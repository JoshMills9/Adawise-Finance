import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useToast } from '../components/ui'
import { ChevronRight, ClockIcon, DropletIcon, LifebuoyIcon, LockIcon, PlusIcon, UsersIcon, VaultIcon } from '../components/icons'
import {
  ACTIVITY_LIMIT,
  ADA_DARK,
  Avatar,
  ConfirmSheet,
  DangerLink,
  DetailHeader,
  EmptyState,
  Field,
  HeartIcon,
  MoneySheet,
  Note,
  Option,
  PrimaryButton,
  Processing,
  Progress,
  Radio,
  Ring,
  SectionTitle,
  Sheet,
  SheetRow,
  ShowAllToggle,
  Tag,
  ToggleRow,
  card,
  goBack,
  type Icon,
} from '../components/ada'
import {
  CREDIT,
  creditLeft,
  GOAL_TYPE_LABEL,
  MAX_PARTNERS,
  SHOW_SAVE_ME_LOAN,
  MILESTONES,
  ghs,
  goalPct,
  monthsSince,
  shortDate,
  withdrawRule,
  type Activity,
  type Goal,
  type Partner,
} from '../lib/demoData'
import { addMonths, amountOf, cleanAmount, firstName, initials, iso, localPhone, longDate, perLabel } from '../lib/format'
import { PartnerGuideLink, PartnerGuideSheet } from '../components/partnerGuide'
import { Celebration, CelebrationButton } from '../components/celebration'
import { goalStore, useContacts, useGoal, useSaveMe, walletStore } from '../lib/goalStore'
import { AddContact } from '../components/contacts'
import { EditInviteSheet } from '../components/editInvite'
import { ApiError } from '../lib/api'
import { removePartner, resendPartnerInvite, editPartnerInvite, withdrawAllAndClose, askPartners, cancelSaveMe, type SaveMeStatus, contributeToGoal, errorText, invitePartner, refreshGoal, refreshSaveMe, saveMeRequest, updateGoalSettings, withdrawFromGoal } from '../lib/adawise'
import { useThemeColor } from '../lib/useThemeColor'
import { CheckMark, Glyph } from '../components/goalIcons'

type SheetName = null | 'deposit' | 'withdraw' | 'locked' | 'saveme' | 'partner' | 'close'

const TYPE_ICON: Record<Goal['type'], Icon> = { flexible: DropletIcon, 'goal-locked': LockIcon, 'time-locked': ClockIcon }

export function GoalDetail() {
  useThemeColor(ADA_DARK)
  const { id } = useParams()
  const goal = useGoal(id)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [toast, toastNode] = useToast()
  const [sheet, setSheet] = useState<SheetName>(() => (params.get('action') === 'add' && (() => { const g = goalStore.all().find((x) => x.id === id); return g ? (g.can?.contribute ?? !g.completed) : true })() ? 'deposit' : null))
  const saveMe = useSaveMe()
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<Partner | null>(null)
  const [pendingPartner, setPendingPartner] = useState<Partner | null>(null)
  const back = () => goBack(navigate)

  // Fresh detail + activity from the API every time the goal opens
  useEffect(() => {
    if (!id) return
    let live = true
    setLoading(true)
    refreshGoal(id)
      .catch((e) => {
        if (live && !(e instanceof ApiError && e.status === 404)) toast(errorText(e))
      })
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!goal && loading) {
    return (
      <div className="font-ada flex h-full flex-col items-center justify-center bg-[#f4f6f7]">
        <Processing title="Loading your goal…" subtitle="Getting the latest from Adawise" />
        {toastNode}
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="font-ada flex h-full flex-col items-center justify-center gap-4 bg-[#f4f6f7] px-8 text-center">
        <p className="text-[18px] font-bold text-ada-dark">This goal doesn't exist anymore</p>
        <div className="w-full max-w-[240px]">
          <PrimaryButton onClick={back}>Back to Adawise</PrimaryButton>
        </div>
      </div>
    )
  }

  const pct = goalPct(goal)
  // The API says what a goal can do right now; without it (demo data) fall back to the old rules
  const canContribute = goal.can?.contribute ?? !goal.completed
  const canSaveMe = goal.can?.saveMe ?? !goal.completed
  const rule = withdrawRule(goal)
  const TypeIcon = TYPE_ICON[goal.type]
  const per = goal.plan ? perLabel(goal.plan.frequency) : 'week'
  const suggested = goal.plan?.amount ?? goal.nextContribution?.amount ?? 50
  const activity = goal.activity ?? []
  const canWithdraw = goal.can?.withdraw ?? true

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(32px+env(safe-area-inset-bottom))]">
        <DetailHeader title="Goal" onBack={back}>
          <div className="flex flex-col items-center px-6 pb-[64px] pt-1 text-center">
            <p className="flex items-center gap-2 text-[20px] font-bold">
              <Glyph name={goal.icon} size={22} /> {goal.name}
            </p>
            <span className="mt-2 flex items-center gap-1 rounded-full bg-white/12 px-3 py-[3px] text-[12.5px] font-semibold text-white/90">
              <TypeIcon size={14} /> {GOAL_TYPE_LABEL[goal.type]}
            </span>
            {goal.completed ? (
            <Celebration
              title="You reached your goal!"
              subtitle={`${goal.name} is fully funded. Well done for sticking with it.`}
              facts={[
                { label: 'Saved', value: ghs(goal.saved, 0) },
                { label: 'Reached', value: goal.reachedOn ? shortDate(goal.reachedOn) : 'Done' },
                ...(goal.reachedOn && daysBetween(goal.createdAt, goal.reachedOn) > 0 ? [{ label: 'Time taken', value: durationText(daysBetween(goal.createdAt, goal.reachedOn)) }] : []),
              ]}
            >
              <CelebrationButton onClick={() => navigate('/adawise/new-goal')}>Start a new goal</CelebrationButton>
            </Celebration>
            ) : (
              <>
              <div className="mt-5">
                <Ring value={pct}>
                  <div>
                    <p className="text-[34px] font-bold leading-none">{pct}%</p>
                    <p className="mt-1 text-[12.5px] text-white/70">of target</p>
                  </div>
                </Ring>
              </div>
              <p className="mt-4 text-[26px] font-bold leading-none">{ghs(goal.saved)}</p>
              <p className="mt-1 text-[14px] text-white/70">of {ghs(goal.target)}</p>
              </>
            )}
          </div>
        </DetailHeader>

        <div className="px-4">
          {/* Actions */}
          <div className={`${card} relative -mt-[44px] grid grid-cols-3 py-3`}>
            <Action icon={PlusIcon} label="Add money" disabled={!canContribute} onClick={() => setSheet('deposit')} />
            <Action
              icon={rule.allowed ? ArrowUpIcon : LockIcon}
              label="Withdraw"
              muted={!rule.allowed}
              disabled={!canWithdraw}
              onClick={() => setSheet(rule.allowed ? 'withdraw' : 'locked')}
              divider
            />
            <Action icon={LifebuoyIcon} label="Save Me" badge={canSaveMe ? `${saveMe.left} left` : undefined} disabled={!canSaveMe} onClick={() => setSheet('saveme')} divider />
          </div>

          {/* Lock status */}
          <div className={`mt-3 flex items-center gap-3 rounded-[14px] px-4 py-3 text-[13.5px] ${rule.allowed ? 'bg-ada-soft text-ada-dark' : 'bg-[#fff4d6] text-[#6b4d00]'}`}>
            {rule.allowed ? <DropletIcon size={18} /> : <LockIcon size={18} />}
            <span className="font-medium">{rule.reason}</span>
          </div>

          {SHOW_SAVE_ME_LOAN && goal.credit && (
            <div className={`${card} mt-3 flex items-center gap-3 p-4`}>
              <span className="grid size-[40px] place-items-center rounded-[12px] bg-[#fff4d6] text-[#8a6300]">
                <VaultIcon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink">Save Me loan · {ghs(goal.credit.amount)}</p>
                <p className="text-[13px] text-muted">{ghs(creditLeft(goal.credit))} left to repay by {longDate(goal.credit.due)}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/adawise/loan')}
                className="h-[34px] shrink-0 rounded-full bg-ada px-[14px] text-[13px] font-bold text-white active:brightness-110"
              >
                Repay
              </button>
            </div>
          )}

          {/* Plan */}
          {goal.plan && (
            <>
              <SectionTitle title="Saving plan" />
              <div className={`${card} divide-y divide-[#eef0f1]`}>
                <div className="flex items-center justify-between px-4 py-[14px]">
                  <div>
                    <p className="text-[20px] font-bold text-ada-dark">
                      {ghs(goal.plan.amount, 0)} <span className="text-[14px] font-medium text-muted">/ {per}</span>
                    </p>
                    <p className="text-[13px] text-muted">for {goal.plan.months} months</p>
                  </div>
                  {goal.nextContribution && (
                    <div className="text-right">
                      <p className="text-[12.5px] text-muted">Next saving</p>
                      <p className="text-[15px] font-semibold text-ink">{shortDate(goal.nextContribution.due)}</p>
                    </div>
                  )}
                </div>
                {goal.plan.periodPaid !== undefined && goal.plan.periodRemaining !== undefined && (
                  <div className="px-4 py-[14px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] text-muted">This {per}</p>
                      <p className="text-[13px] font-semibold text-ink">
                        {ghs(goal.plan.periodPaid)} <span className="font-medium text-muted">of {ghs(goal.plan.amount)}</span>
                      </p>
                    </div>
                    <Progress value={goal.plan.amount > 0 ? Math.min(100, Math.round((goal.plan.periodPaid / goal.plan.amount) * 100)) : 0} />
                    <p className="text-[12.5px] text-muted">
                      {goal.plan.periodRemaining > 0 ? `${ghs(goal.plan.periodRemaining)} to go for this ${per}` : `You're done for this ${per}`}
                    </p>
                  </div>
                )}
                <ToggleRow
                  title="Auto-save from MoMo"
                  desc={`Move ${ghs(goal.plan.amount, 0)} every ${per}`}
                  on={goal.plan.autoSave}
                  onChange={(v) => updateGoalSettings(goal.id, { autoSave: v }).catch((e) => toast(errorText(e)))}
                  disabled={!canContribute}
                />
                <ToggleRow
                  title="Reminders"
                  desc="A nudge before each saving day"
                  on={goal.plan.reminders}
                  onChange={(v) => updateGoalSettings(goal.id, { reminders: v }).catch((e) => toast(errorText(e)))}
                  disabled={!canContribute}
                />
              </div>
            </>
          )}

          {/* Milestones */}
          <SectionTitle title="Milestones" />
          <Milestones goal={goal} />

          {/* Partners */}
          <SectionTitle title="Accountability partners" action={<span className="text-[13px] text-muted">{goal.partners?.length ?? 0} of {MAX_PARTNERS}</span>} />
          <div className={`${card} divide-y divide-[#eef0f1]`}>
            {goal.partners?.map((p) => {
              const pending = p.status === 'invited' && !!p.id
              const body = (
                <>
                  <Avatar initials={p.initials} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ink">{p.name}</p>
                    <p className="text-[12.5px] text-muted">{p.role === 'saver' ? 'Saving with you · WiseCircle' : 'Supporter · can help through Save Me'}</p>
                    {p.id && !pending && (
                      <div className="mt-[6px] flex items-center gap-4 text-[13px] font-semibold">
                        <button type="button" onClick={() => setRemoving(p)} className="text-muted active:text-[#c23a3a]">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {/* They accept from the SMS link or their own Adawise app; the goal refreshes when it reopens */}
                  {p.status === 'invited' ? <Tag tone="amber">Invited</Tag> : <Tag tone="teal">Active</Tag>}
                  {pending && <ChevronRight size={16} className="shrink-0 text-dot" />}
                </>
              )
              // A pending invite opens a sheet to resend, edit or cancel it
              return pending ? (
                <button key={p.id} type="button" onClick={() => setPendingPartner(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  {body}
                </button>
              ) : (
                <div key={p.id ?? p.name} className="flex items-start gap-3 px-4 py-3">
                  {body}
                </div>
              )
            })}
            {(goal.partners?.length ?? 0) < MAX_PARTNERS && (
              <button type="button" onClick={() => setSheet('partner')} className="w-full px-4 py-3 text-left text-[14px] font-semibold text-ada">
                + Add a partner
              </button>
            )}
          </div>

          {/* Activity */}
          <SectionTitle title="Activity" />
          <div className={`${card} overflow-hidden`}>
            <div className="divide-y divide-[#eef0f1]">
              {activity.length === 0 && (
                <EmptyState
                  compact
                  icon={<PlusIcon size={24} />}
                  title="No activity yet"
                  text="Every deposit and withdrawal on this goal will show up here."
                  action={!canContribute ? undefined : { label: 'Add money', onClick: () => setSheet('deposit') }}
                />
              )}
              {(showAllActivity ? activity : activity.slice(0, ACTIVITY_LIMIT)).map((a) => (
                <ActivityRow key={a.id} a={a} />
              ))}
            </div>
            <ShowAllToggle count={activity.length} open={showAllActivity} onToggle={() => setShowAllActivity((v) => !v)} />
          </div>

          {/* Closing needs an empty goal; while it's locked with money in it, there's no way out yet */}
          {(goal.saved === 0 || rule.allowed) && <DangerLink onClick={() => setSheet('close')}>Close goal</DangerLink>}
        </div>
      </main>

      {/* ---- sheets ---- */}
      <MoneySheet
        open={sheet === 'deposit'}
        mode="deposit"
        title="Add money"
        to={goal.name}
        suggestions={[...new Set([suggested, 50, 100, 200])]}
        run={(amt) => contributeToGoal(goal.id, amt)}
        onClose={() => setSheet(null)}
        onDone={(amt) => {
          setSheet(null)
          toast(`${ghs(amt)} added to ${goal.name}`)
        }}
      />
      <MoneySheet
        open={sheet === 'withdraw'}
        mode="withdraw"
        title="Withdraw"
        to={goal.name}
        max={goal.saved}
        run={(amt) => withdrawFromGoal(goal.id, amt)}
        onClose={() => setSheet(null)}
        onDone={(amt) => {
          setSheet(null)
          toast(`${ghs(amt)} sent to your MoMo wallet`)
        }}
      />
      <Sheet open={sheet === 'locked'} onClose={() => setSheet(null)} label="Savings locked">
        <div className="mt-5 flex flex-col items-center text-center">
          <span className="grid size-[56px] place-items-center rounded-full bg-[#fff4d6] text-[#8a6300]">
            <LockIcon size={28} />
          </span>
          <h2 className="mt-4 text-[20px] font-bold text-ada-dark">Your savings are locked</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            {rule.reason}. You chose {GOAL_TYPE_LABEL[goal.type].toLowerCase()} to stay committed. Keep going!
          </p>
        </div>
        <Note>Need money for something unexpected? Save Me lets a partner help you cover a contribution without breaking your goal.</Note>
        <div className="mt-5">
          <PrimaryButton onClick={() => setSheet('saveme')}>Use Save Me</PrimaryButton>
        </div>
        <button type="button" onClick={() => setSheet(null)} className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted">
          Keep saving
        </button>
      </Sheet>
      <ConfirmSheet
        open={sheet === 'close'}
        title={`Close ${goal.name}?`}
        text={
          goal.saved > 0
            ? `We'll send the ${ghs(goal.saved)} in this goal to your MoMo wallet, then close it. Its plan and reminders stop. This can't be undone.`
            : "The goal's plan and reminders stop, and it leaves your goals. This can't be undone."
        }
        confirmLabel={goal.saved > 0 ? `Withdraw ${ghs(goal.saved)} & close` : 'Close goal'}
        busyTitle={goal.saved > 0 ? 'Withdrawing and closing…' : 'Closing your goal…'}
        busySubtitle={goal.saved > 0 ? 'Waiting for MoMo confirmation' : 'This takes a moment'}
        pin={goal.saved > 0 ? `To withdraw ${ghs(goal.saved)} and close ${goal.name}` : undefined}
        run={() => withdrawAllAndClose(goal)}
        onClose={() => setSheet(null)}
        onDone={() => navigate('/adawise/goals', { replace: true })}
      />
      <ConfirmSheet
        open={removing !== null}
        title={`Remove ${removing?.name ?? 'partner'}?`}
        text={`${removing?.name ?? 'They'} will stop getting updates on ${goal.name} and can't help you through Save Me. You can invite someone else after.`}
        confirmLabel="Remove partner"
        busyTitle="Removing partner…"
        run={() => removePartner(goal.id, removing!.id!)}
        onClose={() => setRemoving(null)}
        onDone={() => {
          toast(`${removing?.name} removed from ${goal.name}`)
          setRemoving(null)
        }}
      />
      <PendingPartnerSheet goal={goal} partner={pendingPartner} onClose={() => setPendingPartner(null)} onToast={toast} />
      <AddPartnerSheet open={sheet === 'partner'} goal={goal} onClose={() => setSheet(null)} onToast={toast} />
      <SaveMeSheet open={sheet === 'saveme'} goal={goal} left={saveMe.left} onClose={() => setSheet(null)} onToast={toast} />

      {toastNode}
    </div>
  )
}

/** Owner: what to do with a partner who hasn't answered yet */
function PendingPartnerSheet({ goal, partner, onClose, onToast }: { goal: Goal; partner: Partner | null; onClose: () => void; onToast: (m: string) => void }) {
  const [busy, setBusy] = useState<null | 'resend' | 'cancel'>(null)
  const [editing, setEditing] = useState(false)
  // Keep the name while the sheet slides away
  const [last, setLast] = useState<Partner | null>(null)
  useEffect(() => {
    if (partner) setLast(partner)
    else setEditing(false)
  }, [partner])
  const p = partner ?? last
  const run = async (kind: 'resend' | 'cancel') => {
    if (!partner?.id) return
    setBusy(kind)
    try {
      if (kind === 'resend') {
        await resendPartnerInvite(goal.id, partner.id)
        onToast(`Invite sent again to ${partner.name}`)
      } else {
        await removePartner(goal.id, partner.id)
        onToast(`Invite to ${partner.name} cancelled`)
      }
      onClose()
    } catch (e) {
      onToast(errorText(e)) // e.g. "resend too soon" or the daily invite limit
    } finally {
      setBusy(null)
    }
  }
  return (
    <>
      <Sheet open={partner !== null && !editing} onClose={() => !busy && onClose()} label="Pending invite">
        <h2 className="mt-4 text-[20px] font-bold text-ada-dark">{p?.name}</h2>
        <p className="mt-1 text-[14px] text-muted">Hasn't accepted yet. They get an SMS with a link to join {goal.name}.</p>
        <div className="mt-5 flex flex-col gap-2">
          <PrimaryButton disabled={!!busy} onClick={() => void run('resend')}>
            {busy === 'resend' ? 'Sending…' : 'Send the invite again'}
          </PrimaryButton>
          <button type="button" disabled={!!busy} onClick={() => setEditing(true)} className="h-[46px] w-full rounded-full text-[15px] font-semibold text-ada disabled:opacity-60">
            Edit name, number or role
          </button>
          <button type="button" disabled={!!busy} onClick={() => void run('cancel')} className="h-[46px] w-full rounded-full text-[15px] font-semibold text-[#c23a3a] disabled:opacity-60">
            {busy === 'cancel' ? 'Cancelling…' : 'Cancel invite'}
          </button>
        </div>
      </Sheet>
      <EditInviteSheet
        open={partner !== null && editing}
        title="Edit invite"
        initialName={p?.name ?? ''}
        initialRole={p?.role}
        onSave={async (patch) => {
          await editPartnerInvite(goal.id, p!.id!, patch)
          onClose()
        }}
        onClose={() => setEditing(false)}
        onToast={onToast}
      />
    </>
  )
}

/* ---------- Save Me ---------- */


function SaveMeSheet({ open, goal, left, onClose, onToast }: { open: boolean; goal: Goal; left: number; onClose: () => void; onToast: (m: string) => void }) {
  type Stage = 'choose' | 'partner' | 'waiting' | 'credit' | 'crediting'
  const [stage, setStage] = useState<Stage>('choose')
  const [amount, setAmount] = useState('')
  const [creditAmt, setCreditAmt] = useState('')
  const [sending, setSending] = useState(false)
  const [request, setRequest] = useState<{ id: string; status: SaveMeStatus } | null>(null)

  const partners = (goal.partners ?? []).filter((p) => p.status !== 'invited')
  const fdReached = monthsSince(goal.createdAt) >= MILESTONES[0]!
  const creditLimit = fdReached ? Math.floor(goal.saved * CREDIT.maxShare) : 0
  const canCredit = creditLimit > 0 && !goal.credit
  const askLabel = partners.map((p) => p.name).join(' & ')
  const amt = amountOf(amount)
  const cAmt = amountOf(creditAmt)
  // A rescue covers the contribution you can't make, so it can't be more than that contribution
  const due = goal.nextContribution?.amount ?? goal.plan?.amount ?? 0
  const overDue = amt > due

  const close = () => {
    onClose()
    setTimeout(() => {
      setStage('choose')
      setAmount('')
      setCreditAmt('')
      setRequest(null)
    }, 300)
  }

  // The partner answers in their own app: follow the request until it settles
  useEffect(() => {
    if (stage !== 'waiting' || !request) return
    let live = true
    const t = setInterval(async () => {
      const r = await saveMeRequest(request.id).catch(() => undefined)
      if (!live || !r || r.status === request.status) return
      setRequest({ id: r.id, status: r.status })
      if (r.status === 'completed') {
        void refreshGoal(goal.id).catch(() => undefined)
        void refreshSaveMe().catch(() => undefined)
        onToast(`${r.partner_name ?? askLabel} sent ${ghs(amt)} to ${goal.name}`)
        close()
      } else if (r.status === 'declined' || r.status === 'expired' || r.status === 'failed' || r.status === 'cancelled') {
        onToast(r.status === 'declined' ? 'Request declined. Your Save Me count is unchanged' : r.status === 'expired' ? 'Request expired. Your Save Me count is unchanged' : 'The rescue payment didn’t go through')
        close()
      }
    }, 4000)
    return () => {
      live = false
      clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, request])

  const send = async () => {
    if (!partners.length) return onToast('This partner isn’t ready yet. Try again in a moment.')
    setSending(true)
    try {
      // The API sends it to every accepted partner; the first to approve helps and the rest close
      const r = await askPartners(goal.id, amt)
      setRequest({ id: r.id, status: r.status })
      setStage('waiting')
    } catch (e) {
      onToast(errorText(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onClose={stage === 'crediting' ? undefined : close} label="Save Me">
      {stage === 'choose' && (
        <>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-bold text-ada-dark">Save Me</h2>
              <p className="mt-1 text-[14px] text-muted">Support for when life gets in the way.</p>
            </div>
            <Tag tone={left ? 'teal' : 'grey'}>
              {left} of 3 left this year
            </Tag>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            <Option
              selected={false}
              disabled={!partners.length || !left || !due}
              onClick={() => {
                setAmount(String(due))
                setStage('partner')
              }}
              icon={HeartIcon}
              title="Ask a partner"
              desc={
                !left
                  ? "You've used all 3 Save Me rescues this year. They reset on 1 January."
                  : !partners.length
                    ? 'Add an accountability partner (or wait for them to accept) to use this.'
                    : !due
                      ? 'Set a savings plan on this goal first. Save Me covers a contribution you can’t make.'
                      : `Your partner can choose to cover your ${ghs(due, 0)} contribution. It’s support, not a loan.`
              }
              meta="Uses 1 Save Me if they help"
            />
            {SHOW_SAVE_ME_LOAN && <Option
              selected={false}
              disabled={!canCredit}
              onClick={() => setStage('credit')}
              icon={VaultIcon}
              title="Get a loan"
              desc={
                goal.credit
                  ? 'You already have an active loan on this goal.'
                  : canCredit
                    ? `Borrow up to ${ghs(creditLimit, 0)} against this goal's fixed deposit. Your savings keep growing.`
                    : `Available once this goal reaches its ${MILESTONES[0]}-month milestone and its savings move into a fixed deposit.`
              }
              meta={`Up to ${Math.round(CREDIT.maxShare * 100)}% of your fixed deposit`}
            />}
          </div>
        </>
      )}

      {stage === 'partner' && (
        <>
          <h2 className="mt-4 text-[20px] font-bold text-ada-dark">Ask for help</h2>
          <p className="mt-1 text-[14px] text-muted">The money goes straight into “{goal.name}”.</p>

          {partners.length > 1 && <p className="mt-3 text-[13.5px] text-muted">We ask {askLabel}. The first to approve helps.</p>}

          <div className="mt-5">
            <Field
              label="How much do you need?"
              prefix="GHS"
              placeholder="0.00"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(cleanAmount(e.target.value))}
              error={overDue}
              hint={
                overDue
                  ? `Can't be more than your ${ghs(due, 0)} contribution`
                  : `Up to your next contribution of ${ghs(due, 0)}${goal.nextContribution ? `, due ${shortDate(goal.nextContribution.due)}` : ''}`
              }
            />
          </div>
          <div className="mt-6">
            <PrimaryButton disabled={amt <= 0 || overDue || sending} onClick={() => void send()}>
              {sending ? 'Sending request…' : `Send request to ${askLabel}`}
            </PrimaryButton>
          </div>
          <button type="button" onClick={() => setStage('choose')} className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted">
            Back
          </button>
        </>
      )}

      {stage === 'waiting' && (
        <>
          <Processing title={`Waiting for ${askLabel}`} subtitle={ghs(amt)} />
          <p className="-mt-4 text-center text-[13.5px] leading-relaxed text-muted">
            {askLabel} gets a MoMo request and approves it with their Save Me PIN. Declined requests don't use up a Save Me.
          </p>
          {request?.status === 'approved' && <p className="mt-3 text-center text-[13.5px] font-semibold text-ada-dark">Approved. Waiting for their MoMo payment…</p>}
          <div className="mt-6">
            <PrimaryButton
              onClick={() => {
                onToast(`Request sent. We'll let you know when ${askLabel} answers`)
                close()
              }}
            >
              Done
            </PrimaryButton>
          </div>
          {request?.status === 'pending' && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await cancelSaveMe(request.id)
                  onToast('Request cancelled. Your Save Me count is unchanged')
                  close()
                } catch (e) {
                  onToast(errorText(e))
                }
              }}
              className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted"
            >
              Cancel request
            </button>
          )}
        </>
      )}

      {stage === 'credit' && (
        <>
          <h2 className="mt-4 text-[20px] font-bold text-ada-dark">Get a loan</h2>
          <p className="mt-1 text-[14px] text-muted">Your fixed deposit is the collateral, so your goal stays intact.</p>
          <div className="mt-5">
            <Field
              label="Amount"
              prefix="GHS"
              placeholder="0.00"
              inputMode="decimal"
              value={creditAmt}
              onChange={(e) => setCreditAmt(cleanAmount(e.target.value))}
              error={cAmt > creditLimit}
              hint={cAmt > creditLimit ? `Maximum is ${ghs(creditLimit, 0)}` : `Up to ${ghs(creditLimit, 0)}`}
            />
          </div>
          <div className="mt-4 divide-y divide-[#eef0f1] rounded-[14px] bg-[#f4f6f7] text-[14px]">
            <SheetRow label="Paid to" value="Your Adawise wallet (Available)" />
            <SheetRow label="Repay" value={cAmt ? ghs(cAmt * (1 + CREDIT.feeRate)) : '—'} />
            <SheetRow label="Due by" value={longDate(addMonths(CREDIT.months))} />
          </div>
          <p className="mt-3 text-center text-[12.5px] text-muted">Demo terms: {Math.round(CREDIT.feeRate * 100)}% fee over {CREDIT.months} months.</p>
          <div className="mt-4">
            <PrimaryButton disabled={cAmt <= 0 || cAmt > creditLimit} onClick={() => setStage('crediting')}>
              Get {cAmt ? ghs(cAmt) : 'loan'}
            </PrimaryButton>
          </div>
          <button type="button" onClick={() => setStage('choose')} className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted">
            Back
          </button>
        </>
      )}

      {stage === 'crediting' && (
        <CreditProcessing
          onDone={() => {
            goalStore.update(goal.id, (g) => ({ ...g, credit: { amount: cAmt, due: iso(addMonths(CREDIT.months)), repaid: 0, takenOn: iso(new Date()) } }))
            goalStore.record(goal.id, 'credit', cAmt, 0, 'Loan against fixed deposit')
            walletStore.addCredit(cAmt, goal.id, `Save Me loan · ${goal.name}`)
            onToast(`${ghs(cAmt)} loan added to your available balance`)
            close()
          }}
        />
      )}
    </Sheet>
  )
}

function CreditProcessing({ onDone }: { onDone: () => void }) {
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const t = setTimeout(() => done.current(), 1500)
    return () => clearTimeout(t)
  }, [])
  return <Processing title="Approving your loan…" subtitle="Checking your fixed deposit" />
}

/* ---------- pieces ---------- */

const daysBetween = (from: string, to: string) => Math.max(0, Math.round((new Date(to + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()) / 86_400_000))
const durationText = (days: number) => (days >= 60 ? `${Math.round(days / 30)} months` : days >= 14 ? `${Math.round(days / 7)} weeks` : `${days} day${days === 1 ? '' : 's'}`)

function Action({ icon: I, label, onClick, badge, muted, divider, disabled }: { icon: Icon; label: string; onClick: () => void; badge?: string; muted?: boolean; divider?: boolean; disabled?: boolean }) {
  muted = muted || disabled
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`relative flex flex-col items-center gap-[6px] py-1 disabled:cursor-not-allowed ${divider ? 'border-l border-[#eef0f1]' : ''}`}>
      <span className={`grid size-[46px] place-items-center rounded-full ${muted ? 'bg-[#eef2f4] text-muted' : 'bg-ada-soft text-ada'}`}>
        <I size={22} />
      </span>
      <span className={`text-[13px] font-semibold ${muted ? 'text-muted' : 'text-ada-dark'}`}>{label}</span>
      {badge && <span className="absolute right-[14%] top-0 rounded-full bg-ada px-[6px] text-[10px] font-bold leading-[16px] text-white">{badge}</span>}
    </button>
  )
}

function Milestones({ goal }: { goal: Goal }) {
  // The API's milestone progress wins; until it loads, work it out from the start date
  const months = goal.milestones?.months ?? monthsSince(goal.createdAt)
  const interest = goal.milestones?.interest ?? (goal.activity ?? []).filter((a) => a.kind === 'interest').reduce((s, a) => s + a.amount, 0)
  const reached = (m: number) => (goal.milestones ? goal.milestones.earned.includes(m) : months >= m)
  const next = MILESTONES.find((m) => !reached(m))
  return (
    <div className={`${card} p-4`}>
      <div className="relative flex justify-between">
        <span className="absolute inset-x-[18px] top-[17px] h-[3px] rounded-full bg-[#e6ebec]" />
        <span
          className="absolute left-[18px] top-[17px] h-[3px] rounded-full bg-ada transition-[width]"
          style={{ width: `calc((100% - 36px) * ${Math.min(1, Math.max(0, (months - 3) / 9))})` }}
        />
        {MILESTONES.map((m) => {
          const done = reached(m)
          return (
            <div key={m} className="relative flex w-[36px] flex-col items-center">
              <span className={`grid size-[36px] place-items-center rounded-full text-[13px] font-bold ring-4 ring-white ${done ? 'bg-ada text-white' : 'bg-[#e6ebec] text-muted'}`}>
                {done ? <CheckMark size={16} /> : m}
              </span>
              <span className="mt-2 whitespace-nowrap text-[12px] text-muted">{m} months</span>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-[13.5px] leading-relaxed text-ink">
        {next ? (
          <>
            {reached(3) ? 'Savings are in a fixed deposit. ' : ''}Next milestone in <b>{Math.max(1, next - months)} month{Math.max(1, next - months) === 1 ? '' : 's'}</b>. Keep saving to earn interest, paid upfront.
          </>
        ) : (
          'All milestones reached. Brilliant consistency!'
        )}
      </p>
      {interest > 0 && <p className="mt-2 text-[13px] font-semibold text-ada-dark">Interest paid upfront so far: {ghs(interest)}</p>}
    </div>
  )
}

const KIND: Record<Activity['kind'], { label: string; sign: 1 | -1 | 0; icon: ReactNode }> = {
  deposit: { label: 'Deposit', sign: 1, icon: <PlusIcon size={18} /> },
  'auto-save': { label: 'Auto-save', sign: 1, icon: <ClockIcon size={18} /> },
  withdrawal: { label: 'Withdrawal', sign: -1, icon: <ArrowUpIcon size={18} /> },
  rescue: { label: 'Save Me rescue', sign: 1, icon: <HeartIcon size={18} /> },
  interest: { label: 'Milestone interest', sign: 1, icon: <VaultIcon size={18} /> },
  credit: { label: 'Loan to Adawise wallet', sign: 0, icon: <UsersIcon size={18} /> },
  repayment: { label: 'Loan repayment', sign: 0, icon: <VaultIcon size={18} /> },
}

function ActivityRow({ a }: { a: Activity }) {
  const k = KIND[a.kind]
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-[36px] shrink-0 place-items-center rounded-full bg-surface text-ink">{k.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold text-ink">{k.label}</p>
        <p className="truncate text-[12.5px] text-muted">
          {shortDate(a.date)}
          {a.note ? ` · ${a.note}` : ''}
        </p>
      </div>
      <p className={`shrink-0 text-[14.5px] font-bold ${k.sign < 0 ? 'text-[#b93535]' : k.sign > 0 ? 'text-ada-dark' : 'text-ink'}`}>
        {k.sign > 0 ? '+' : k.sign < 0 ? '−' : ''}
        {ghs(a.amount)}
      </p>
    </div>
  )
}

function ArrowUpIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

/* ---------- add a partner to an existing goal ---------- */

function AddPartnerSheet({ open, goal, onClose, onToast }: { open: boolean; goal: Goal; onClose: () => void; onToast: (m: string) => void }) {
  // The chosen contact's phone number
  const [who, setWho] = useState<string>('')
  const [role, setRole] = useState<'saver' | 'supporter' | null>(null)
  const contacts = useContacts()
  const taken = new Set((goal.partners ?? []).map((p) => p.name))
  const options = contacts.filter((c) => !taken.has(firstName(c.name)))
  const person = contacts.find((c) => c.phone === who)
  const close = () => {
    onClose()
    setTimeout(() => {
      setWho('')
      setRole(null)
    }, 300)
  }
  const [busy, setBusy] = useState(false)
  const [guide, setGuide] = useState(false)
  const send = async () => {
    if (!person || !role) return
    const name = firstName(person.name)
    setBusy(true)
    try {
      await invitePartner(goal.id, person, role)
    } catch (e) {
      onToast(errorText(e))
      setBusy(false)
      return
    }
    // The invite is sent; a failed refresh shouldn't make it look like it wasn't (sending again would fail as a duplicate)
    void refreshGoal(goal.id).catch(() => undefined)
    onToast(`Invite sent to ${name}`)
    setBusy(false)
    close()
  }

  return (
    <>
    <Sheet open={open && !guide} onClose={close} label="Add a partner">
      <h2 className="mt-4 text-[20px] font-bold text-ada-dark">Add a partner</h2>
      <p className="mt-1 text-[14px] text-muted">
        {goal.partners?.length ?? 0} of {MAX_PARTNERS} partners on {goal.name}
      </p>
      <PartnerGuideLink onClick={() => setGuide(true)} />
      {options.length > 0 && (
        <div className={`${card} mt-4 divide-y divide-[#eef0f1]`}>
          {options.map((c) => (
            <button key={c.phone} type="button" onClick={() => setWho(c.phone)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <Avatar initials={initials(c.name)} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">{c.name}</span>
                <span className="block text-[12.5px] text-muted">{localPhone(c.phone)}</span>
              </span>
              <Radio on={who === c.phone} />
            </button>
          ))}
        </div>
      )}
      <AddContact key={open && options.length === 0 ? 'first' : 'more'} defaultOpen={options.length === 0} action="Choose" fromPhone onAdd={(c) => setWho(c.phone)} />
      {person && (
        <>
          <p className="mt-5 text-[14px] font-semibold text-ada-dark">How will {firstName(person.name)} take part?</p>
          <div className="mt-2 flex flex-col gap-3">
            <Option selected={role === 'saver'} onClick={() => setRole('saver')} icon={UsersIcon} title="Save with me" desc="They save towards their own goal alongside you in a WiseCircle." />
            <Option selected={role === 'supporter'} onClick={() => setRole('supporter')} icon={HeartIcon} title="Cheer me on" desc="They follow your progress, encourage you and can help through Save Me." />
          </div>
        </>
      )}
      <div className="mt-5">
        <PrimaryButton disabled={!person || !role || busy} onClick={() => void send()}>
          {busy ? 'Sending invite…' : `Send invite${person ? ` to ${firstName(person.name)}` : ''}`}
        </PrimaryButton>
      </div>
    </Sheet>
    {/* Swap sheets rather than stacking them, so the guide opens on its own and returns here */}
    <PartnerGuideSheet open={open && guide} onClose={() => setGuide(false)} />
    </>
  )
}
