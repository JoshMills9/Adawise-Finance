import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/ui'
import { ChevronRight, LifebuoyIcon, UsersIcon } from '../components/icons'
import {
  ADA_DARK,
  Avatar,
  BackPath,
  Check,
  DetailHeader,
  IconButton,
  Note,
  PinPad,
  PrimaryButton,
  Processing,
  Progress,
  SectionTitle,
  SheetRow,
  SuccessScreen,
  Tag,
  card,
  goBack,
} from '../components/ada'
import { GOAL_TYPE_LABEL, SAVE_ME, SAVE_ME_TERMS, ghs, shortDate, type InviteRequest, type PartnerRequest, type SaveMeRequest } from '../lib/demoData'
import { firstName } from '../lib/format'
import { DEMO_WALLET } from '../components/ada'
import { noticeStore, partnerProfile, requestStore, supportStore, useHasSaveMePin, useRequest, useRequests } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'

/* ======================= list ======================= */

export function RequestsList() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const requests = useRequests()
  const pending = requests.filter((r) => r.status === 'pending')
  const done = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className="min-h-0 flex-1 overflow-y-auto pb-8">
        <DetailHeader title="Requests for you" onBack={() => goBack(navigate)}>
          <p className="px-8 pb-8 text-center text-[14px] leading-relaxed text-white/75">
            When people trust you as their accountability partner, their invitations and Save Me requests land here.
          </p>
        </DetailHeader>

        <div className="px-4">
          <SectionTitle title="Waiting for you" action={<Tag tone={pending.length ? 'teal' : 'grey'}>{pending.length}</Tag>} />
          {pending.length === 0 ? (
            <div className={`${card} px-4 py-8 text-center`}>
              <p className="text-[28px]">🎉</p>
              <p className="mt-2 text-[15px] font-semibold text-ink">You're all caught up</p>
              <p className="mt-1 text-[13px] text-muted">New invitations and Save Me requests will show up here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map((r) => (
                <RequestCard key={r.id} r={r} onClick={() => navigate(`/adawise/requests/${r.id}`)} />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <>
              <SectionTitle title="Earlier" />
              <div className={`${card} divide-y divide-[#eef0f1]`}>
                {done.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar initials={r.initials} size={36} />
                    <p className="min-w-0 flex-1 text-[14px] text-ink">
                      {r.kind === 'invite' ? `${firstName(r.from)}'s ${r.goalName} invite` : `${firstName(r.from)}'s Save Me · ${ghs(r.amount, 0)}`}
                    </p>
                    <Tag tone={r.status === 'declined' ? 'grey' : 'teal'}>{r.status === 'declined' ? 'Declined' : r.status === 'accepted' ? 'Accepted' : 'Sent'}</Tag>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function RequestCard({ r, onClick }: { r: PartnerRequest; onClick: () => void }) {
  const save = r.kind === 'saveme'
  return (
    <button type="button" onClick={onClick} className={`${card} flex items-start gap-3 p-4 text-left`}>
      <span className={`grid size-[44px] shrink-0 place-items-center rounded-[14px] ${save ? 'bg-[#fff4d6] text-[#8a6300]' : 'bg-ada-soft text-ada'}`}>
        {save ? <LifebuoyIcon size={22} /> : <UsersIcon size={22} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-ink">{save ? 'Save Me request' : 'Partner invitation'}</span>
          {save && <Tag tone="amber">Urgent</Tag>}
        </span>
        <span className="mt-[2px] block text-[13.5px] leading-snug text-muted">
          {save
            ? `${firstName(r.from)} needs ${ghs(r.amount, 0)} for ${r.goalEmoji} ${r.goalName}: "${r.reason}"`
            : `${firstName(r.from)} wants you to ${r.role === 'saver' ? 'save with them' : 'cheer them on'} for ${r.goalEmoji} ${r.goalName}`}
        </span>
        <span className="mt-1 block text-[12px] text-muted">{shortDate(r.date)}</span>
      </span>
      <span className="mt-3 text-dot">
        <ChevronRight size={18} />
      </span>
    </button>
  )
}

/* ======================= detail ======================= */

export function RequestDetail() {
  useThemeColor(ADA_DARK)
  const { id } = useParams()
  const r = useRequest(id)
  const navigate = useNavigate()
  const back = () => goBack(navigate, '/adawise/requests')

  if (!r) {
    return (
      <div className="font-ada flex h-full flex-col items-center justify-center gap-4 bg-[#f4f6f7] px-8 text-center">
        <p className="text-[18px] font-bold text-ada-dark">This request isn't available</p>
        <div className="w-full max-w-[240px]">
          <PrimaryButton onClick={back}>Back</PrimaryButton>
        </div>
      </div>
    )
  }
  return r.kind === 'invite' ? <InviteFlow r={r} onExit={back} /> : <SaveMeFlow r={r} onExit={back} />
}

/** Plain white screen with a back button, for multi-stage flows */
function FlowShell({ title, onBack, children, footer }: { title: string; onBack: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <header className="ada-card-gradient shrink-0 pt-[env(safe-area-inset-top)] text-white">
        <div className="flex h-[56px] items-center justify-between px-2">
          <IconButton label="Back" onClick={onBack}>
            <BackPath />
          </IconButton>
          <h1 className="text-[17px] font-semibold">{title}</h1>
          <span className="size-11" />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-5">{children}</div>
      {footer && <div className="shrink-0 border-t border-[#e6ebec] bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">{footer}</div>}
    </div>
  )
}

/* ---------- accept an invitation ---------- */

function InviteFlow({ r, onExit }: { r: InviteRequest; onExit: () => void }) {
  const navigate = useNavigate()
  const [toast, toastNode] = useToast()
  const hasPin = useHasSaveMePin()
  type Stage = 'review' | 'pin' | 'pin-confirm' | 'terms' | 'done'
  const [stage, setStage] = useState<Stage>('review')
  const [firstPin, setFirstPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [agreed, setAgreed] = useState<boolean[]>(SAVE_ME_TERMS.map(() => false))
  const name = firstName(r.from)
  const pct = Math.round((r.saved / r.target) * 100)

  const finish = () => {
    requestStore.update(r.id, { status: 'accepted' })
    supportStore.add({
      id: `sup-${r.id}`,
      person: name,
      initials: r.initials,
      goalName: r.goalName,
      emoji: r.goalEmoji,
      type: r.goalType,
      saved: r.saved,
      target: r.target,
      role: r.role,
      streak: 'Just started with you as partner',
    })
    noticeStore.push({ kind: 'partner', text: `You're now ${name}'s accountability partner for ${r.goalName}` })
    setStage('done')
  }

  if (stage === 'done') {
    return (
      <SuccessScreen
        title={`You're ${name}'s partner!`}
        subtitle={`${r.goalEmoji} ${r.goalName} · ${r.role === 'saver' ? 'Saving together' : 'Supporter'}`}
        rows={[
          `You'll get ${name}'s milestones and progress updates`,
          'Your Save Me PIN is set and ready',
          `${name} can ask you for help up to ${SAVE_ME.allowed} times a year`,
        ]}
        action="Done"
        onAction={() => navigate('/adawise', { replace: true })}
      />
    )
  }

  if (stage === 'pin' || stage === 'pin-confirm') {
    return (
      <FlowShell title="Save Me PIN" onBack={() => setStage(stage === 'pin' ? 'review' : 'pin')}>
        <PinPad
          resetKey={attempt}
          error={pinError}
          title={stage === 'pin' ? 'Create your Save Me PIN' : 'Confirm your PIN'}
          subtitle={stage === 'pin' ? 'You’ll use this 4-digit PIN to approve Save Me payments. It’s separate from your MoMo PIN.' : 'Enter the same 4 digits again.'}
          onComplete={(pin) => {
            if (stage === 'pin') {
              setFirstPin(pin)
              setPinError('')
              setAttempt((a) => a + 1)
              setStage('pin-confirm')
            } else if (pin === firstPin) {
              partnerProfile.setPin(pin)
              setPinError('')
              setStage('terms')
            } else {
              setPinError("PINs don't match. Try again.")
              setAttempt((a) => a + 1)
              setStage('pin')
            }
          }}
        />
      </FlowShell>
    )
  }

  if (stage === 'terms') {
    const all = agreed.every(Boolean)
    return (
      <FlowShell title="Save Me terms" onBack={() => setStage(hasPin ? 'review' : 'pin')} footer={<PrimaryButton disabled={!all} onClick={finish}>Accept and become a partner</PrimaryButton>}>
        <h2 className="text-[22px] font-bold leading-tight text-ada-dark">Before you say yes</h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">Please confirm you understand how Save Me works.</p>
        <div className={`${card} mt-5 divide-y divide-[#eef0f1]`}>
          {SAVE_ME_TERMS.map((t, i) => (
            <button key={t} type="button" onClick={() => setAgreed((a) => a.map((v, j) => (j === i ? !v : v)))} className="flex w-full items-start gap-3 px-4 py-3 text-left">
              <Check on={agreed[i]!} />
              <span className="text-[14px] leading-snug text-ink">{t}</span>
            </button>
          ))}
        </div>
        {!all && (
          <button type="button" onClick={() => setAgreed(SAVE_ME_TERMS.map(() => true))} className="mt-3 text-[14px] font-semibold text-ada">
            Agree to all
          </button>
        )}
      </FlowShell>
    )
  }

  // review
  return (
    <FlowShell
      title="Partner invitation"
      onBack={onExit}
      footer={
        <>
          <PrimaryButton onClick={() => setStage(hasPin ? 'terms' : 'pin')}>Accept invitation</PrimaryButton>
          <button
            type="button"
            onClick={() => {
              requestStore.update(r.id, { status: 'declined' })
              toast(`You declined ${name}'s invitation`)
              setTimeout(onExit, 700)
            }}
            className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted"
          >
            Decline
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <Avatar initials={r.initials} size={64} dark />
        <h2 className="mt-4 text-[22px] font-bold leading-tight text-ada-dark">
          {name} wants you as their accountability partner
        </h2>
        <p className="mt-2 text-[14.5px] text-muted">
          Role: <b className="text-ink">{r.role === 'saver' ? 'Save together (WiseCircle)' : 'Supporter'}</b>
        </p>
      </div>

      <div className={`${card} mt-5 p-4`}>
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-bold text-ada-dark">
            {r.goalEmoji} {r.goalName}
          </p>
          <Tag>{GOAL_TYPE_LABEL[r.goalType]}</Tag>
        </div>
        <Progress value={pct} />
        <p className="text-[13px] text-muted">
          {ghs(r.saved, 0)} of {ghs(r.target, 0)} · {pct}%
        </p>
      </div>

      <SectionTitle title="As a partner you'll" />
      <div className={`${card} p-4`}>
        <ul className="flex flex-col gap-2 text-[14px] leading-snug text-ink">
          <li>✅ See {name}'s progress and milestones</li>
          <li>✅ Send encouragement and reminders</li>
          <li>✅ Be able to help through Save Me, only if you want to</li>
          <li>🚫 Never own, control or withdraw their money</li>
        </ul>
      </div>
      {!hasPin && <Note>Next you'll create a 4-digit Save Me PIN and accept the Save Me terms.</Note>}
      {toastNode}
    </FlowShell>
  )
}

/* ---------- approve a Save Me request ---------- */

function SaveMeFlow({ r, onExit }: { r: SaveMeRequest; onExit: () => void }) {
  const navigate = useNavigate()
  const [toast, toastNode] = useToast()
  const hasPin = useHasSaveMePin()
  type Stage = 'review' | 'pay' | 'pin-create' | 'pin-create-confirm' | 'pin' | 'processing' | 'done'
  const [stage, setStage] = useState<Stage>('review')
  const [firstPin, setFirstPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [tries, setTries] = useState(0)
  const name = firstName(r.from)
  const nth = r.theirUsed + 1
  const ordinal = ['1st', '2nd', '3rd'][nth - 1] ?? `${nth}th`

  const approve = () => {
    setStage('processing')
    setTimeout(() => {
      requestStore.update(r.id, { status: 'approved' })
      supportStore.update(r.supportedId, (s) => ({ ...s, saved: s.saved + r.amount }))
      noticeStore.push({ kind: 'saveme', text: `You rescued ${name}'s ${r.goalName} with ${ghs(r.amount, 0)} 💚` })
      setStage('done')
    }, 1600)
  }

  if (stage === 'done') {
    return (
      <SuccessScreen
        title={`You saved ${name}!`}
        subtitle={`${ghs(r.amount)} sent to ${r.goalEmoji} ${r.goalName}`}
        rows={[`${name} has been told you helped`, 'This was a gift, not a loan', `This is ${name}'s ${ordinal} Save Me of ${SAVE_ME.allowed} this year`]}
        action="Done"
        onAction={() => navigate('/adawise', { replace: true })}
      />
    )
  }

  if (stage === 'processing') {
    return (
      <FlowShell title="Save Me" onBack={() => {}}>
        <Processing title="Sending your help…" subtitle="Confirming with MoMo" />
      </FlowShell>
    )
  }

  if (stage === 'pin-create' || stage === 'pin-create-confirm') {
    return (
      <FlowShell title="Save Me PIN" onBack={() => setStage('pay')}>
        <PinPad
          resetKey={attempt}
          error={pinError}
          title={stage === 'pin-create' ? 'Set up your Save Me PIN' : 'Confirm your PIN'}
          subtitle={stage === 'pin-create' ? 'First time approving? Create a 4-digit PIN. It’s separate from your MoMo PIN.' : 'Enter the same 4 digits again.'}
          onComplete={(pin) => {
            if (stage === 'pin-create') {
              setFirstPin(pin)
              setPinError('')
              setAttempt((a) => a + 1)
              setStage('pin-create-confirm')
            } else if (pin === firstPin) {
              partnerProfile.setPin(pin)
              approve()
            } else {
              setPinError("PINs don't match. Try again.")
              setAttempt((a) => a + 1)
              setStage('pin-create')
            }
          }}
        />
      </FlowShell>
    )
  }

  if (stage === 'pin') {
    const left = 3 - tries
    return (
      <FlowShell title="Save Me PIN" onBack={() => setStage('pay')}>
        <PinPad
          resetKey={attempt}
          error={pinError}
          title="Enter your Save Me PIN"
          subtitle={`To send ${ghs(r.amount)} to ${name}`}
          onComplete={(pin) => {
            if (partnerProfile.checkPin(pin)) return approve()
            const t = tries + 1
            setTries(t)
            setAttempt((a) => a + 1)
            if (t >= 3) {
              toast('Too many wrong PINs. Try again later')
              setTimeout(onExit, 900)
            } else setPinError(`Incorrect PIN. ${left - 1} ${left - 1 === 1 ? 'try' : 'tries'} left`)
          }}
        />
        {toastNode}
      </FlowShell>
    )
  }

  if (stage === 'pay') {
    return (
      <FlowShell
        title="Approve payment"
        onBack={() => setStage('review')}
        footer={
          <>
            <PrimaryButton onClick={() => setStage(hasPin ? 'pin' : 'pin-create')}>Approve payment</PrimaryButton>
            <button type="button" onClick={() => setStage('review')} className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted">
              Back
            </button>
          </>
        }
      >
        <p className="text-center text-[14px] text-muted">MoMo payment request</p>
        <p className="mt-1 text-center text-[34px] font-bold text-ada-dark">{ghs(r.amount)}</p>
        <div className="mt-5 divide-y divide-[#eef0f1] rounded-[14px] bg-white text-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <SheetRow label="To" value={`${r.from} · ${r.goalName}`} />
          <SheetRow label="From" value={`MoMo wallet ${DEMO_WALLET}`} />
          <SheetRow label="Type" value="Save Me gift" />
          <SheetRow label="Fee" value="GHS 0.00" />
        </div>
        <Note>After approving, you'll confirm with your Save Me PIN. Demo only: no real money moves.</Note>
      </FlowShell>
    )
  }

  // review
  return (
    <FlowShell
      title="Save Me request"
      onBack={onExit}
      footer={
        <>
          <PrimaryButton onClick={() => setStage('pay')}>Help {name} with {ghs(r.amount, 0)}</PrimaryButton>
          <button
            type="button"
            onClick={() => {
              requestStore.update(r.id, { status: 'declined' })
              noticeStore.push({ kind: 'saveme', text: `You declined ${name}'s Save Me request. It won't count against their 3.` })
              toast(`Declined. ${name} keeps all ${SAVE_ME.allowed - r.theirUsed} remaining Save Me's`)
              setTimeout(onExit, 900)
            }}
            className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted"
          >
            Not this time
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className="grid size-[64px] place-items-center rounded-full bg-[#fff4d6] text-[#8a6300]">
          <LifebuoyIcon size={32} />
        </span>
        <h2 className="mt-4 text-[22px] font-bold leading-tight text-ada-dark">{name} needs a hand</h2>
        <p className="mt-1 text-[34px] font-bold text-ink">{ghs(r.amount, 0)}</p>
        <p className="mt-1 text-[14.5px] text-muted">“{r.reason}”</p>
      </div>
      <div className={`${card} mt-5 divide-y divide-[#eef0f1] text-[14px]`}>
        <SheetRow label="For goal" value={`${r.goalEmoji} ${r.goalName}`} />
        <SheetRow label="Requested" value={shortDate(r.date)} />
        <SheetRow label="Save Me use" value={`${ordinal} of ${SAVE_ME.allowed} this year`} />
      </div>
      <Note>Save Me is a gift, not a loan. The money goes straight into {name}'s goal, so it keeps working towards their target.</Note>
      {toastNode}
    </FlowShell>
  )
}
