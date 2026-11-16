// Shared "you did it" card for finished goals and circles: a gold medal, a one-off confetti burst, and a few facts.
import { useMemo, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { CheckMark, TrophyIcon } from './goalIcons'

const COLORS = ['#14b39f', '#f5b83d', '#ffffff', '#7fdccf', '#f28f6b']

/** A short burst of confetti that falls from the top of its (relatively positioned) parent, once */
function Confetti({ count = 26 }: { count?: number }) {
  const reduce = useReducedMotion()
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: 4 + Math.random() * 92,
        size: 6 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 120,
        spin: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.35,
        duration: 1.8 + Math.random() * 1.2,
        color: COLORS[i % COLORS.length]!,
        round: i % 3 === 0,
      })),
    [count],
  )
  if (reduce) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block"
          style={{ left: `${p.left}%`, width: p.size, height: p.round ? p.size : p.size * 1.6, background: p.color, borderRadius: p.round ? '50%' : 2 }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: 260, x: p.drift, rotate: p.spin, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

export type CelebrationFact = { label: string; value: string }

/**
 * Celebration for the dark detail header: medal, headline, a line of context, up to three facts and an optional button.
 * Use it in place of the progress ring once a goal or circle is complete.
 */
export function Celebration({
  eyebrow = 'Goal reached',
  title,
  subtitle,
  facts = [],
  children,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  facts?: CelebrationFact[]
  children?: ReactNode
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} aria-live="polite" className="relative mt-4 w-full max-w-[340px]">
      <Confetti />
      {/* Soft glow behind the medal */}
      <div aria-hidden className="absolute left-1/2 top-[-30px] size-[200px] -translate-x-1/2 rounded-full bg-[#f5b83d]/20 blur-3xl" />

      <div className="relative mx-auto grid size-[72px] place-items-center">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#f5b83d]/30"
          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: 2, ease: 'easeOut' }}
        />
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
          className="relative grid size-[72px] place-items-center rounded-full bg-gradient-to-br from-[#ffd877] via-[#f5b83d] to-[#d98e12] text-[#5a3a00] shadow-[0_6px_18px_rgba(245,184,61,0.4),inset_0_2px_0_rgba(255,255,255,0.45)]"
        >
          <TrophyIcon size={34} />
          <span className="absolute -bottom-1 -right-1 grid size-[26px] place-items-center rounded-full bg-[#14b39f] text-white ring-[3px] ring-[#12212f]">
            <CheckMark size={14} />
          </span>
        </motion.span>
      </div>

      <p className="relative mt-3 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#f5b83d]">{eyebrow}</p>
      <h2 className="relative mt-1 text-[22px] font-bold leading-tight">{title}</h2>
      {subtitle && <p className="relative mx-auto mt-1 max-w-[290px] text-[13.5px] leading-snug text-white/70">{subtitle}</p>}

      {facts.length > 0 && (
        <dl className="relative mt-4 grid gap-px overflow-hidden rounded-[14px] bg-white/10" style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}>
          {facts.map((f) => (
            <div key={f.label} className="bg-white/[0.07] px-2 py-[10px]">
              <dd className="text-[16px] font-bold leading-tight">{f.value}</dd>
              <dt className="mt-[2px] text-[11.5px] text-white/60">{f.label}</dt>
            </div>
          ))}
        </dl>
      )}

      {children && <div className="relative mt-4 flex flex-col gap-2">{children}</div>}
    </motion.section>
  )
}

/** Call to action for the dark header */
export function CelebrationButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-[46px] w-full rounded-full bg-ada text-[15px] font-semibold text-white transition active:brightness-110">
      {children}
    </button>
  )
}
