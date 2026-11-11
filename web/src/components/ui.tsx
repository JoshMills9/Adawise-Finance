import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

/* ---------- Toast (used for features that are off in the demo) ---------- */

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const show = useCallback((msg: string) => {
    clearTimeout(timer.current)
    setMessage(msg)
    timer.current = setTimeout(() => setMessage(null), 2000)
  }, [])

  const node = (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="pointer-events-none absolute inset-x-0 bottom-[calc(110px+env(safe-area-inset-bottom))] z-30 flex justify-center px-6"
        >
          <span className="rounded-full bg-[#2b2b2b]/90 px-5 py-3 text-center text-[14px] text-white shadow-lg">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
  return [show, node] as const
}

export const DEMO_DISABLED = 'Not available in this demo'

/* ---------- Buttons ---------- */

export function PillButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-[58px] w-full rounded-full bg-navy text-[18px] font-bold uppercase tracking-[0.04em] text-white transition-[filter,background-color] active:brightness-125 disabled:bg-disabled disabled:active:brightness-100"
    >
      {children}
    </button>
  )
}

export function TextButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[56px] w-full text-[18px] font-bold uppercase tracking-[0.04em] text-navy active:opacity-60"
    >
      {children}
    </button>
  )
}

/** Bottom area that holds the main action, clear of the home indicator */
export function Footer({ children }: { children: ReactNode }) {
  return <div className="shrink-0 px-5 pb-[calc(34px+env(safe-area-inset-bottom))] short:pb-[calc(16px+env(safe-area-inset-bottom))]">{children}</div>
}

/* ---------- Top bar ---------- */

function ChevronLeft() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4 7 12l8 8" />
    </svg>
  )
}

function CloseX() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  )
}

export function TopBar({
  title,
  onBack,
  onClose,
  solid = true,
}: {
  title?: string
  onBack?: () => void
  onClose?: () => void
  /** false = transparent (sits on a gradient header) */
  solid?: boolean
}) {
  return (
    <header className={`shrink-0 pt-[env(safe-area-inset-top)] ${solid ? 'bg-navy' : ''}`}>
      <div className="flex h-[80px] items-center justify-between px-[18px] text-yellow">
        <button type="button" aria-label="Back" onClick={onBack} className="grid size-11 place-items-center active:opacity-60">
          {onBack && <ChevronLeft />}
        </button>
        {title && <h1 className="text-[22px] font-semibold text-white">{title}</h1>}
        <button type="button" aria-label="Close" onClick={onClose} className="grid size-11 place-items-center active:opacity-60">
          {onClose && <CloseX />}
        </button>
      </div>
    </header>
  )
}

/* ---------- Images with graceful placeholders ---------- */

const ILLUSTRATION_EXTS = ['jpg', 'png'] as const

/**
 * Loads /illustrations/<name>.jpg (or .png). Until a file exists, shows the
 * grey MoMo-style circle so layouts stay correct.
 */
export function Illustration({ name, label, size }: { name: string; label: string; size: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'failed'>('loading')
  const [ext, setExt] = useState(0)
  const onError = () => (ext < ILLUSTRATION_EXTS.length - 1 ? setExt(ext + 1) : setState('failed'))
  return (
    <div className="relative mx-auto aspect-square shrink-0" style={{ width: size }}>
      {state !== 'ok' && (
        <div className="absolute inset-[9%] grid place-items-center rounded-full bg-surface shadow-[0_0_0_10px_white,0_10px_30px_rgba(0,0,0,0.10)]">
          {state === 'failed' && <span className="px-6 text-center text-[13px] text-dot">{label}</span>}
        </div>
      )}
      <img
        src={`/illustrations/${name}.${ILLUSTRATION_EXTS[ext]}`}
        alt=""
        draggable={false}
        onLoad={() => setState('ok')}
        onError={onError}
        className={`absolute inset-0 h-full w-full object-contain ${state === 'ok' ? '' : 'invisible'}`}
      />
    </div>
  )
}

/** MoMo lockup: round icon (/brand/momo-icon.png) with "MoMo from MTN" beneath */
export function MomoLogo({ iconSize = 56 }: { iconSize?: number }) {
  return (
    <div className="flex flex-col items-center" role="img" aria-label="MoMo from MTN">
      <img
        src="/brand/momo-icon.png"
        alt=""
        draggable={false}
        // The source PNG has a white background; clipping to a circle hides it
        className="rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.30)]"
        style={{ width: iconSize, height: iconSize }}
      />
      <div className="mt-2 text-center leading-none text-yellow">
        <div className="font-bold tracking-tight" style={{ fontSize: iconSize * 0.72 }}>
          MoMo
        </div>
        <div className="mt-[2px] font-bold" style={{ fontSize: iconSize * 0.22 }}>
          from MTN
        </div>
      </div>
    </div>
  )
}

export function GhanaFlag({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Ghana">
      <defs>
        <clipPath id="gh-circle">
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath="url(#gh-circle)">
        <rect width="24" height="8" fill="#CE1126" />
        <rect y="8" width="24" height="8" fill="#FCD116" />
        <rect y="16" width="24" height="8" fill="#006B3F" />
        <polygon points="12,8.4 12.95,11 15.6,11 13.45,12.65 14.25,15.3 12,13.7 9.75,15.3 10.55,12.65 8.4,11 11.05,11" fill="#000" />
      </g>
    </svg>
  )
}

export function Spinner() {
  return (
    <svg className="size-[22px] animate-spin text-navy" viewBox="0 0 24 24" fill="none">
      <path d="M12 2a10 10 0 1 1-9.5 6.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
