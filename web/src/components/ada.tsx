// Shared building blocks for the Adawise screens (Adawise colours + MTN Brighter Sans).
import { useEffect, useRef, useState, type ComponentType, type InputHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from "motion/react"
import type { NavigateFunction } from "react-router-dom"
import { ghs } from '../lib/demoData'
import { PERIODS, amountOf, cleanAmount } from '../lib/format'
import { BulbIcon, CheckMark } from './goalIcons'
import { ChevronRight } from './icons'

export type Icon = ComponentType<{ size?: number }>
export const ADA_DARK = '#12212F'
export const DEMO_WALLET = '241 234 567'
export const DEMO_NAME = 'Ama Mensah'
export const card = 'rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]'

/**
 * Friendly placeholder for an empty list: icon in a soft disc, a short title, one line of help
 * and an optional action. `compact` fits inside a card; the default suits a whole screen.
 */
export function EmptyState({
  icon,
  title,
  text,
  action,
  compact,
}: {
  icon: ReactNode
  title: string
  text?: string
  action?: { label: string; onClick: () => void }
  compact?: boolean
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'px-6 pb-6 pt-7' : 'px-8 py-12'}`}>
      <span className={`relative grid place-items-center ${compact ? 'size-[64px]' : 'size-[84px]'}`}>
        <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-[#d5dedf]" />
        <span className={`grid place-items-center rounded-full bg-surface text-ink ${compact ? 'size-[48px]' : 'size-[64px]'}`}>{icon}</span>
      </span>
      <p className={`font-bold text-ada-dark ${compact ? 'mt-3 text-[15.5px]' : 'mt-4 text-[17px]'}`}>{title}</p>
      {text && <p className="mt-1 max-w-[270px] text-[13.5px] leading-relaxed text-muted">{text}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 h-[40px] rounded-full bg-ada-dark px-5 text-[14px] font-semibold text-white transition active:scale-[0.97]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/** Activity lists show this many items until expanded */
export const ACTIVITY_LIMIT = 5

/** "Show all (n)" / "Show less" footer for a list capped at ACTIVITY_LIMIT; renders nothing when the list fits */
export function ShowAllToggle({ count, open, onToggle }: { count: number; open: boolean; onToggle: () => void }) {
  if (count <= ACTIVITY_LIMIT) return null
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className="flex w-full items-center justify-center gap-1 border-t border-[#eef0f1] py-3 text-[14px] font-semibold text-ada active:bg-[#f7f9f9]"
    >
      {open ? 'Show less' : `Show all (${count})`}
      <span className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}>
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

/* ---------- layout ---------- */

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-11 place-items-center active:opacity-60">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}

export const BackPath = () => <path d="M15 4 7 12l8 8" />
export const ClosePath = () => <path d="M5 5l14 14M19 5 5 19" />

/** Dark navy header with a curved bottom, used on detail screens */
export function DetailHeader({ title, onBack, right, children }: { title: string; onBack: () => void; right?: ReactNode; children?: ReactNode }) {
  return (
    <header
      className="ada-card-gradient relative pt-[env(safe-area-inset-top)] text-white"
      style={{ borderBottomLeftRadius: '50% 22px', borderBottomRightRadius: '50% 22px' }}
    >
      <div className="flex h-[56px] items-center justify-between px-2">
        <IconButton label="Back" onClick={onBack}>
          <BackPath />
        </IconButton>
        <h1 className="text-[17px] font-semibold">{title}</h1>
        <div className="grid size-11 place-items-center">{right}</div>
      </div>
      {children}
    </header>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      {action}
    </div>
  )
}

export function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h2 className="text-[22px] font-bold leading-tight text-ada-dark">{title}</h2>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{subtitle}</p>
    </>
  )
}

/** Step progress bar shown under a flow's top bar */
export function StepBar({ steps, step }: { steps: readonly string[]; step: number }) {
  return (
    <div className="px-5 pb-4">
      <div className="flex gap-[6px]">
        {steps.map((s, i) => (
          <span key={s} className={`h-[4px] flex-1 rounded-full transition-colors ${i <= step ? 'bg-ada' : 'bg-white/20'}`} />
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-white/70">
        Step {step + 1} of {steps.length} · {steps[step]}
      </p>
    </div>
  )
}

/* ---------- buttons & inputs ---------- */

export function PrimaryButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-[54px] w-full rounded-full bg-ada text-[16px] font-semibold text-white transition active:brightness-110 disabled:bg-[#c5d0d1]"
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-1 h-[44px] w-full text-[15px] font-semibold text-ada active:opacity-60">
      {children}
    </button>
  )
}

export function Field({
  label,
  prefix,
  hint,
  error,
  ...input
}: { label: string; prefix?: ReactNode; hint?: string; error?: boolean } & Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'>) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-[#4a5a5c]">{label}</span>
      <div
        className={`mt-[6px] flex h-[54px] items-center gap-2 rounded-[14px] border bg-white px-4 transition focus-within:ring-4 ${
          error ? 'border-[#d03b3b] focus-within:ring-[#d03b3b]/15' : 'border-[#d5dedf] focus-within:border-ada focus-within:ring-ada/15'
        }`}
      >
        {prefix && <span className="shrink-0 text-[15px] font-semibold text-muted">{prefix}</span>}
        <input {...input} className="h-full w-full min-w-0 bg-transparent text-[17px] text-ink outline-none placeholder:text-[#a3adae]" />
      </div>
      {hint && <span className={`mt-[6px] block text-[12.5px] ${error ? 'text-[#d03b3b]' : 'text-muted'}`}>{hint}</span>}
    </label>
  )
}

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[38px] rounded-full border px-4 text-[14px] font-medium transition ${
        selected ? 'border-ada bg-ada text-white' : 'border-[#d5dedf] bg-white text-ink'
      }`}
    >
      {children}
    </button>
  )
}

export function PeriodChips({ value, onChange, disabled }: { value: number; onChange: (m: number) => void; disabled?: boolean }) {
  return (
    <div className={`mt-2 grid grid-cols-4 gap-2 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      {PERIODS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`h-[48px] rounded-[12px] border text-[14px] font-semibold transition ${
            value === m ? 'border-ada bg-ada text-white' : 'border-[#d5dedf] bg-white text-ink'
          }`}
        >
          {m} mo
        </button>
      ))}
    </div>
  )
}

/** Pill-shaped segmented control */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="mt-2 grid gap-1 rounded-full bg-[#e6ebec] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`h-[38px] rounded-full text-[14px] font-semibold transition ${
            value === o.id ? 'bg-white text-ada-dark shadow-[0_1px_4px_rgba(0,0,0,0.12)]' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Radio({ on }: { on: boolean }) {
  return (
    <span className={`grid size-[22px] shrink-0 place-items-center rounded-full border-2 ${on ? 'border-ada' : 'border-[#c5d0d1]'}`}>
      {on && <span className="size-[10px] rounded-full bg-ada" />}
    </span>
  )
}

export function Check({ on }: { on: boolean }) {
  return (
    <span className={`grid size-[22px] shrink-0 place-items-center rounded-[7px] border-2 transition ${on ? 'border-ada bg-ada' : 'border-[#c5d0d1]'}`}>
      {on && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
    </span>
  )
}

/** Large selectable card with icon, description and a small rule tag */
export function Option({
  selected,
  onClick,
  icon: I,
  title,
  desc,
  meta,
  disabled,
}: {
  selected: boolean
  onClick: () => void
  icon: Icon
  title: string
  desc: string
  meta?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-[16px] border-2 p-4 text-left transition disabled:opacity-50 ${
        selected ? 'border-ada bg-ada-soft/60' : 'border-transparent bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]'
      }`}
    >
      <span className={`grid size-[42px] shrink-0 place-items-center rounded-[12px] ${selected ? 'bg-ada text-white' : 'bg-ada-soft text-ada'}`}>
        <I size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold text-ada-dark">{title}</span>
        <span className="mt-[2px] block text-[13.5px] leading-snug text-muted">{desc}</span>
        {meta && <span className="mt-2 inline-block rounded-full bg-[#eef2f4] px-2 py-[2px] text-[12px] font-semibold text-ada-dark">{meta}</span>}
      </span>
      <Radio on={selected} />
    </button>
  )
}

export function ToggleRow({ title, desc, on, onChange }: { title: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center gap-3 px-4 py-[14px] text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        <span className="block text-[13px] text-muted">{desc}</span>
      </span>
      <span className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors ${on ? 'bg-ada' : 'bg-[#c5d0d1]'}`}>
        <span className={`absolute top-[3px] size-[22px] rounded-full bg-white shadow transition-all ${on ? 'left-[23px]' : 'left-[3px]'}`} />
      </span>
    </button>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 flex gap-2 rounded-[14px] bg-ada-soft px-4 py-3 text-[13px] leading-relaxed text-ada-dark">
      <BulbIcon size={18} className="mt-[1px] shrink-0 text-ada" />
      <span>{children}</span>
    </p>
  )
}

export function ReviewRow({ label, value, onEdit, last }: { label: string; value: string; onEdit?: () => void; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${last ? '' : 'border-b border-[#eef0f1]'}`}>
      <span className="w-[76px] shrink-0 text-[13.5px] text-muted">{label}</span>
      <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-ink">{value}</span>
      {onEdit && <EditLink onClick={onEdit} />}
    </div>
  )
}

export function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 text-[13.5px] font-semibold text-ada active:opacity-60">
      Edit
    </button>
  )
}

/* ---------- data display ---------- */

export function Progress({ value, className = 'my-[10px]' }: { value: number; className?: string }) {
  return (
    <div className={`h-[7px] overflow-hidden rounded-full bg-[#e6ebec] ${className}`}>
      <div className="h-full rounded-full bg-ada transition-[width] duration-500" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

/** Circular progress ring for the dark headers */
export function Ring({ value, size = 156, stroke = 12, children }: { value: number; size?: number; stroke?: number; children: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#14b39f"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(100, value) / 100) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Avatar({ initials, size = 30, ring, dark }: { initials: string; size?: number; ring?: boolean; dark?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold tracking-normal ${dark ? 'bg-ada text-white' : 'bg-ada-soft text-ada-dark'} ${ring ? 'ring-2 ring-white' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  )
}

export function Tag({ children, tone = 'grey' }: { children: ReactNode; tone?: 'grey' | 'teal' | 'amber' }) {
  const tones = { grey: 'bg-[#eef2f4] text-muted', teal: 'bg-ada-soft text-ada-dark', amber: 'bg-[#fff4d6] text-[#8a6300]' }
  return <span className={`shrink-0 rounded-full px-2 py-[2px] text-[11.5px] font-semibold ${tones[tone]}`}>{children}</span>
}

export function SuccessRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 text-[14px] text-white/90">
      <CheckMark size={16} className="mt-[3px] shrink-0 text-ada" />
      <span>{text}</span>
    </div>
  )
}

/** Full-screen teal "done" screen with an animated tick */
export function SuccessScreen({ title, subtitle, rows, action, onAction }: { title: string; subtitle: string; rows: string[]; action: string; onAction: () => void }) {
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
        <h1 className="mt-8 text-[26px] font-bold">{title}</h1>
        <p className="mt-2 text-[16px] text-white/80">{subtitle}</p>
        {rows.length > 0 && (
          <div className="mt-8 w-full divide-y divide-white/10 rounded-[18px] bg-white/8 text-left ring-1 ring-white/10">
            {rows.map((r) => (
              <SuccessRow key={r} text={r} />
            ))}
          </div>
        )}
      </div>
      <div className="px-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <PrimaryButton onClick={onAction}>{action}</PrimaryButton>
      </div>
    </div>
  )
}

export function HeartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />
    </svg>
  )
}

/* ---------- bottom sheets ---------- */

export function Sheet({ open, onClose, label, children }: { open: boolean; onClose?: () => void; label: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="absolute inset-0 z-40 bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="font-ada absolute inset-x-0 bottom-0 z-50 max-h-[90%] overflow-y-auto rounded-t-[24px] bg-white px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
          >
            <div className="mx-auto h-[5px] w-[40px] rounded-full bg-[#d9d9d9]" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function SheetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <span className="text-muted">{label}</span>
      <span className="truncate text-right font-semibold text-ink">{value}</span>
    </div>
  )
}

export function Processing({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center py-10">
      <span className="size-[44px] animate-spin rounded-full border-[3px] border-ada-soft border-t-ada" />
      <p className="mt-4 text-[16px] font-semibold text-ada-dark">{title}</p>
      <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
    </div>
  )
}

/**
 * Add money / withdraw: amount → confirm → processing. Pass `fixedAmount` to skip
 * straight to confirm. Demo only: no PIN is asked for and no real money moves.
 */
export function MoneySheet({
  open,
  mode,
  title,
  to,
  fixedAmount,
  suggestions = [],
  max,
  run,
  onClose,
  onDone,
}: {
  open: boolean
  mode: 'deposit' | 'withdraw'
  title: string
  to: string
  fixedAmount?: number
  suggestions?: number[]
  max?: number
  /** The real payment (API call + waiting for MoMo). Without it, processing is a short pause. */
  run?: (amount: number) => Promise<unknown>
  onClose: () => void
  onDone: (amount: number) => void
}) {
  const [stage, setStage] = useState<'amount' | 'confirm' | 'processing' | 'failed'>('amount')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const done = useRef(onDone)
  done.current = onDone
  const runRef = useRef(run)
  runRef.current = run

  useEffect(() => {
    if (!open) return
    setStage(fixedAmount ? 'confirm' : 'amount')
    setValue(fixedAmount ? String(fixedAmount) : '')
  }, [open, fixedAmount])

  const amount = fixedAmount ?? amountOf(value)
  useEffect(() => {
    if (stage !== 'processing') return
    const pay = runRef.current
    if (!pay) {
      const t = setTimeout(() => done.current(amount), 1500)
      return () => clearTimeout(t)
    }
    let live = true
    pay(amount).then(
      () => live && done.current(amount),
      (e: unknown) => {
        if (!live) return
        setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
        setStage('failed')
      },
    )
    return () => {
      live = false
    }
  }, [stage, amount])

  const withdraw = mode === 'withdraw'
  const tooMuch = max !== undefined && amount > max

  return (
    <Sheet open={open} onClose={stage === 'processing' ? undefined : onClose} label={title}>
      {stage === 'amount' && (
        <>
          <h2 className="mt-4 text-[20px] font-bold text-ada-dark">{title}</h2>
          <p className="mt-1 text-[14px] text-muted">
            {withdraw ? 'To' : 'From'} MoMo wallet {DEMO_WALLET}
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
              hint={tooMuch ? `You can ${withdraw ? 'withdraw' : 'add'} up to ${ghs(max!)}` : max !== undefined ? `Available: ${ghs(max)}` : undefined}
            />
          </div>
          {suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((n) => (
                <Chip key={n} selected={amountOf(value) === n} onClick={() => setValue(String(n))}>
                  {ghs(n, 0)}
                </Chip>
              ))}
            </div>
          )}
          <div className="mt-5">
            <PrimaryButton disabled={amount <= 0 || tooMuch} onClick={() => setStage('confirm')}>
              Continue
            </PrimaryButton>
          </div>
        </>
      )}

      {stage === 'confirm' && (
        <>
          <p className="mt-5 text-center text-[14px] text-muted">{withdraw ? 'Withdraw to your MoMo wallet' : 'Pay from your MoMo wallet'}</p>
          <p className="mt-1 text-center text-[32px] font-bold text-ada-dark">{ghs(amount)}</p>
          <div className="mt-5 divide-y divide-[#eef0f1] rounded-[14px] bg-[#f4f6f7] text-[14px]">
            <SheetRow label={withdraw ? 'From' : 'To'} value={`Adawise · ${to}`} />
            <SheetRow label={withdraw ? 'To' : 'From'} value={`MoMo wallet ${DEMO_WALLET}`} />
            <SheetRow label="Fee" value="GHS 0.00" />
          </div>
          <p className="mt-3 text-center text-[12.5px] text-muted">Demo only. No real money moves and no PIN is needed.</p>
          <div className="mt-4">
            <PrimaryButton onClick={() => setStage('processing')}>{withdraw ? 'Confirm withdrawal' : 'Approve payment'}</PrimaryButton>
          </div>
          <button
            type="button"
            onClick={fixedAmount ? onClose : () => setStage('amount')}
            className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted active:opacity-60"
          >
            {fixedAmount ? 'Cancel' : 'Back'}
          </button>
        </>
      )}

      {stage === 'processing' && <Processing title="Processing…" subtitle="Waiting for MoMo confirmation" />}

      {stage === 'failed' && (
        <div className="flex flex-col items-center pt-8 text-center">
          <p className="text-[18px] font-bold text-ada-dark">{withdraw ? "Withdrawal didn't go through" : "Payment didn't go through"}</p>
          <p className="mt-2 max-w-[300px] text-[14px] text-muted">{error}</p>
          <div className="mt-6 w-full">
            <PrimaryButton onClick={() => setStage('confirm')}>Try again</PrimaryButton>
          </div>
          <button type="button" onClick={onClose} className="mt-1 h-[44px] w-full text-[15px] font-semibold text-muted active:opacity-60">
            Close
          </button>
        </div>
      )}
    </Sheet>
  )
}

/** Confirm-only payment (used when the amount is already known) */
export function PaymentSheet({
  open,
  amount,
  goalName,
  run,
  onCancel,
  onApproved,
}: {
  open: boolean
  amount: number
  goalName: string
  run?: (amount: number) => Promise<unknown>
  onCancel: () => void
  onApproved: () => void
}) {
  return <MoneySheet open={open} mode="deposit" title="Confirm payment" to={goalName} fixedAmount={amount} run={run} onClose={onCancel} onDone={() => onApproved()} />
}

/** Back to wherever a screen was opened from; `fallback` if it was opened directly */
export function goBack(navigate: NavigateFunction, fallback = "/adawise") {
  if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
  else navigate(fallback, { replace: true })
}

/**
 * 4-digit Save Me PIN entry with its own keypad (this is NOT the MoMo PIN).
 * Change `resetKey` to clear the dots, e.g. after a wrong PIN.
 */
export function PinPad({
  title,
  subtitle,
  error,
  resetKey,
  onComplete,
}: {
  title: string
  subtitle?: string
  error?: string
  resetKey?: number
  onComplete: (pin: string) => void
}) {
  const [pin, setPin] = useState('')
  const done = useRef(onComplete)
  done.current = onComplete
  useEffect(() => setPin(''), [resetKey])
  useEffect(() => {
    if (pin.length !== 4) return
    const t = setTimeout(() => done.current(pin), 180)
    return () => clearTimeout(t)
  }, [pin])

  const press = (k: string) => setPin((p) => (k === '⌫' ? p.slice(0, -1) : p.length < 4 ? p + k : p))

  return (
    <div className="flex flex-col items-center">
      <h2 className="mt-4 text-center text-[20px] font-bold text-ada-dark">{title}</h2>
      {subtitle && <p className="mt-1 max-w-[290px] text-center text-[14px] text-muted">{subtitle}</p>}
      <motion.div
        key={`${resetKey}`}
        animate={error ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.35 }}
        className="mt-6 flex gap-4"
        aria-label={`${pin.length} of 4 digits entered`}
      >
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`size-[16px] rounded-full transition ${i < pin.length ? 'bg-ada' : 'border-2 border-[#c5d0d1]'}`} />
        ))}
      </motion.div>
      <p className={`mt-3 h-[18px] text-[13px] font-medium ${error ? 'text-[#d03b3b]' : 'text-transparent'}`}>{error || '.'}</p>
      <div className="mt-2 grid w-full max-w-[300px] grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k ? (
            <button
              key={i}
              type="button"
              aria-label={k === '⌫' ? 'Delete' : k}
              onClick={() => press(k)}
              className="h-[58px] rounded-[16px] text-[24px] font-semibold text-ada-dark transition active:bg-ada-soft"
            >
              {k}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  )
}
