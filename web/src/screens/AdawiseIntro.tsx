// First visit to Adawise from MoMo's Save screen: welcome → terms → sign in → Adawise home.
// In Adawise colours: #12212f bar with white back/close, teal buttons, #12212f / black text.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADA_DARK, BackPath, ClosePath, Field, IconButton, PrimaryButton } from '../components/ada'
import { Footer } from '../components/ui'
import { session } from '../lib/session'
import { auth } from '../lib/api'
import { errorText, signIn } from '../lib/adawise'
import { useThemeColor } from '../lib/useThemeColor'

const closeToHome = (navigate: ReturnType<typeof useNavigate>) => () => navigate('/home', { replace: true })

function AdaTopBar({ title, onBack, onClose }: { title: string; onBack: () => void; onClose: () => void }) {
  return (
    <header className="ada-card-gradient shrink-0 pt-[env(safe-area-inset-top)] text-white">
      <div className="flex h-[64px] items-center justify-between px-2">
        <IconButton label="Back" onClick={onBack}>
          <BackPath />
        </IconButton>
        <h1 className="text-[19px] font-bold">{title}</h1>
        <IconButton label="Close" onClick={onClose}>
          <ClosePath />
        </IconButton>
      </div>
    </header>
  )
}

export function AdawiseWelcome() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()

  return (
    <div className="font-ada flex h-full flex-col bg-white">
      <AdaTopBar title="Adawise" onBack={() => navigate(-1)} onClose={closeToHome(navigate)} />

      <main className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-[34px] text-center short:pt-4">
        <WelcomeArt />
        <h2 className="mt-[34px] text-[24px] font-bold text-ada-dark short:mt-5">Welcome to Adawise</h2>
        <p className="mt-3 max-w-[330px] text-[17px] leading-[1.45] text-muted">
          Set savings goals, save with people you trust and earn interest every time you hit a milestone.
        </p>
      </main>

      <Footer>
        <PrimaryButton onClick={() => navigate('/adawise/terms')}>Get started</PrimaryButton>
        <p className="mt-4 text-center text-[13px] text-muted">
          Adawise{' '}
          <button type="button" onClick={() => navigate('/adawise/terms')} className="font-semibold text-ada underline-offset-2 active:underline">
            Terms and Conditions
          </button>{' '}
          apply.
        </p>
      </Footer>
    </div>
  )
}

/** Soft disc with the Adawise owl */
function WelcomeArt() {
  return (
    <div className="relative aspect-square w-[min(68vw,270px)] shrink-0 short:w-[190px]">
      <div className="absolute inset-[6%] rounded-full bg-[#eef2f4] shadow-[0_0_0_10px_white,0_10px_30px_rgba(18,33,47,0.10)]" />
      <img src="/brand/adawise-logo.png" alt="" draggable={false} className="absolute left-1/2 top-1/2 w-[50%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_6px_10px_rgba(0,0,0,0.12)]" />
    </div>
  )
}

const TERMS = [
  'Flexible savings can be withdrawn to your MoMo wallet at any time.',
  'Goal-locked savings stay locked until you reach your target. Time-locked savings stay locked until the date you choose.',
  'At 3, 6, 9 and 12 months, qualifying savings move into a fixed deposit and the interest is paid upfront.',
  'Save Me – Partner Support: Up to 3 successful rescues per calendar year. Partner contributions are voluntary and are not loans.',
  'Save Me – Loan: Eligible users may apply for an advance or loan against their fixed-deposit savings to meet emergency financial needs, without breaking their investment. Approval and lending terms are subject to the applicable financial institution.',
  'Interest rates may change. We will tell you when they do.',
]

export function AdawiseTerms() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="font-ada flex h-full flex-col bg-white">
      <AdaTopBar title="Terms and Conditions" onBack={() => navigate(-1)} onClose={closeToHome(navigate)} />

      <main className="min-h-0 flex-1 overflow-y-auto px-6 pt-6">
        <p className="text-[17px] leading-[1.5] text-ada-dark">Before you start saving with Adawise, here is what you are agreeing to:</p>
        <ul className="mt-4 flex flex-col gap-3">
          {TERMS.map((t) => (
            <li key={t} className="flex gap-3 text-[15.5px] leading-[1.45] text-muted">
              <span className="mt-[9px] size-[6px] shrink-0 rounded-full bg-ada-dark" />
              {t}
            </li>
          ))}
        </ul>

        <label className="mt-7 flex cursor-pointer items-start gap-4 pb-6">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="peer sr-only" />
          <span
            aria-hidden
            className={`mt-[2px] grid size-[26px] shrink-0 place-items-center rounded-[6px] border-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-ada/20 ${
              agreed ? 'border-ada bg-ada text-white' : 'border-[#9aa5ad] bg-white text-transparent'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <span className="text-[15.5px] leading-[1.45] text-ink">I have read, understood and agree to the Adawise Terms and Conditions.</span>
        </label>
      </main>

      <Footer>
        <PrimaryButton
          disabled={!agreed}
          onClick={() => {
            session.acceptAdawiseTerms()
            navigate(auth.isSignedIn() ? '/adawise' : '/adawise/login', { replace: true })
          }}
        >
          Next
        </PrimaryButton>
      </Footer>
    </div>
  )
}

/** Adawise sign-in (after the terms): the MoMo number is the Adawise identity */
export function AdawiseLogin() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  // MoMo sign-in stores "233XXXXXXXXX"; the field holds the 9 digits after +233
  const [phone, setPhone] = useState(() => session.msisdn().replace(/^233/, '').slice(0, 9))
  const [name, setName] = useState(() => auth.user()?.name ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const valid = /^\d{9}$/.test(phone) && name.trim().length >= 2

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError('')
    try {
      await signIn(`+233${phone}`, name.trim())
      navigate('/adawise', { replace: true })
    } catch (e) {
      setError(errorText(e))
      setBusy(false)
    }
  }

  return (
    <div className="font-ada flex h-full flex-col bg-white">
      <AdaTopBar title="Sign in" onBack={() => navigate(-1)} onClose={closeToHome(navigate)} />

      <main className="min-h-0 flex-1 overflow-y-auto px-6 pt-7">
        <h2 className="text-[24px] font-bold text-ada-dark">Sign in to Adawise</h2>
        <p className="mt-2 text-[16px] leading-[1.45] text-muted">Use your MoMo number. Your Adawise savings are linked to it.</p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <Field
            label="MoMo number"
            prefix="+233"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="24 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').replace(/^0/, '').slice(0, 9))}
          />
          <Field label="Your name" autoComplete="name" placeholder="e.g. Ama Mensah" value={name} onChange={(e) => setName(e.target.value)} />
          {error && <p className="rounded-[12px] bg-[#fdefef] px-4 py-3 text-[14px] text-[#b93535]">{error}</p>}
          <button type="submit" hidden />
        </form>
      </main>

      <Footer>
        <PrimaryButton disabled={!valid || busy} onClick={() => void submit()}>
          {busy ? 'Signing in…' : 'Continue'}
        </PrimaryButton>
      </Footer>
    </div>
  )
}
