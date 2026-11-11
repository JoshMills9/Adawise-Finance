import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer, GhanaFlag, MomoLogo, PillButton } from '../components/ui'
import { session } from '../lib/session'
import { NAVY, useThemeColor } from '../lib/useThemeColor'

const COUNTRY_CODE = '233'
const LOCAL_LENGTH = 9 // e.g. 241380745

/** Keeps digits only, drops a leading 0 (024… → 24…), caps at 9 digits */
function sanitize(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith(COUNTRY_CODE) && d.length > LOCAL_LENGTH) d = d.slice(COUNTRY_CODE.length)
  if (d.startsWith('0')) d = d.slice(1)
  return d.slice(0, LOCAL_LENGTH)
}

export function Welcome() {
  useThemeColor(NAVY)
  const navigate = useNavigate()
  const [number, setNumber] = useState(() => session.msisdn().slice(COUNTRY_CODE.length))
  const valid = number.length === LOCAL_LENGTH

  const submit = () => {
    if (!valid) return
    session.setMsisdn(COUNTRY_CODE + number)
    navigate('/verify')
  }

  return (
    <div className="relative flex h-full flex-col bg-white">
      {/* Curved navy header */}
      <div
        className="momo-gradient absolute inset-x-0 top-0 h-[calc(350px+env(safe-area-inset-top))] short:h-[calc(290px+env(safe-area-inset-top))]"
        style={{ borderBottomLeftRadius: '50% 44px', borderBottomRightRadius: '50% 44px' }}
      />

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="flex justify-center pt-[calc(env(safe-area-inset-top)+80px)] short:pt-[calc(env(safe-area-inset-top)+36px)]">
          <MomoLogo iconSize={56} />
        </div>

        {/* Card */}
        <form
          className="mx-5 mt-[52px] rounded-[24px] bg-white px-5 pb-5 pt-[38px] narrow:mx-4 narrow:px-4 short:mt-8 short:pt-7 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <h1 className="text-center text-[clamp(17px,5.6vw,22px)] text-navy">
            Welcome to <span className="font-semibold">MoMo</span>
          </h1>

          <div className="mt-[40px] flex gap-[13px] narrow:gap-2 short:mt-7">
            <button
              type="button"
              aria-label="Country: Ghana"
              className="grid h-[80px] w-[69px] shrink-0 narrow:w-[56px] place-items-center rounded-[18px] border-[1.5px] border-ink"
            >
              <GhanaFlag size={30} />
            </button>
            <NumberField value={number} onChange={(v) => setNumber(sanitize(v))} />
          </div>
        </form>

        <p className="mx-auto mt-[44px] max-w-[300px] px-4 short:mt-6 text-center text-[15px] leading-[1.45] text-muted">
          By using this app you agree to our{' '}
          <a href="#" className="text-navy" onClick={(e) => e.preventDefault()}>
            Mobile Terms of Use
          </a>{' '}
          and{' '}
          <a href="#" className="text-navy" onClick={(e) => e.preventDefault()}>
            Privacy Policy
          </a>
        </p>
      </div>

      <Footer>
        <PillButton disabled={!valid} onClick={submit}>
          Next
        </PillButton>
      </Footer>
    </div>
  )
}

/** Outlined input with a floating label that notches into the border, like MoMo's */
function NumberField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false)
  const floated = focused || value.length > 0
  const label = 'Enter number *'

  return (
    <label className="relative block h-[80px] min-w-0 flex-1 cursor-text">
      {/* Border with a gap for the floated label */}
      <fieldset
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-[8px] bottom-0 m-0 rounded-[18px] border-[1.5px] border-ink px-[16px]"
      >
        <legend
          className={`invisible h-4 overflow-hidden whitespace-nowrap p-0 text-[14px] leading-4 transition-[max-width] duration-150 ${
            floated ? 'max-w-full px-[6px]' : 'max-w-[0.01px]'
          }`}
        >
          {label}
        </legend>
      </fieldset>

      <span
        className={`pointer-events-none absolute left-[22px] origin-left narrow:left-4 whitespace-nowrap text-ink transition-all duration-150 ${
          floated ? '-top-[9px] text-[14px]' : 'top-1/2 -translate-y-1/2 text-[clamp(17px,5.6vw,22px)]'
        }`}
      >
        {label}
      </span>

      <div className={`absolute inset-0 flex items-center gap-[10px] pl-[22px] pr-3 narrow:gap-[6px] narrow:pl-4 text-[clamp(17px,5.6vw,22px)] tracking-wide ${floated ? '' : 'opacity-0'}`}>
        <span className="text-muted">{COUNTRY_CODE}</span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          aria-label="Mobile number"
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-ink outline-none"
        />
      </div>
    </label>
  )
}
