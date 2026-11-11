// Line icons for goal/circle categories and small UI marks (used instead of emoji).
import type { ReactNode } from 'react'

export type GlyphName =
  | 'target'
  | 'laptop'
  | 'home'
  | 'school'
  | 'medical'
  | 'business'
  | 'travel'
  | 'ring'
  | 'party'
  | 'gift'
  | 'group'

const PATHS: Record<GlyphName, ReactNode> = {
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="1.6" />
      <path d="M2 19h20" />
    </>
  ),
  home: (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  school: (
    <>
      <path d="M2 9.5 12 5l10 4.5-10 4.5z" />
      <path d="M6 11.5v4.5c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
      <path d="M22 9.5v5" />
    </>
  ),
  medical: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5h6v2" />
      <path d="M12 10.5v6M9 13.5h6" />
    </>
  ),
  business: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7" />
      <path d="M3 12.5h18" />
    </>
  ),
  travel: (
    <>
      <rect x="5" y="7" width="14" height="13" rx="2" />
      <path d="M9 7V4h6v3" />
      <path d="M9 11v5M15 11v5" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="15" r="6" />
      <path d="M9 3.5h6L12 8.5z" />
    </>
  ),
  party: (
    <>
      <path d="M4 20l4.5-11.5 7 7z" />
      <path d="M14 3v2.5M18.5 5.5 17 7M21 10h-2.5M12.5 7.5l1.5-1.5" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9M12 8v13" />
      <path d="M12 8C10 4 6.5 4.5 7 6.8 7.4 8 12 8 12 8zm0 0c2-4 5.5-3.5 5-1.2C16.6 8 12 8 12 8z" />
    </>
  ),
  group: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M16.5 14.6c2.4.2 4.2 1.9 5 4.9" />
    </>
  ),
}

/** A goal or circle's category icon. Falls back to a target for unknown names. */
export function Glyph({ name, size = 22, className }: { name?: string; size?: number; className?: string }) {
  const paths = PATHS[(name as GlyphName) in PATHS ? (name as GlyphName) : 'target']
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths}
    </svg>
  )
}

/* ---------- small UI marks ---------- */

const mark = (size: number, children: ReactNode, strokeWidth = 1.6, className?: string) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    {children}
  </svg>
)

export const CheckMark = ({ size = 16, className }: { size?: number; className?: string }) => mark(size, <path d="M5 12.5l4.5 4.5L19 7.5" />, 2.4, className)

export const CheckCircle = ({ size = 20, className }: { size?: number; className?: string }) =>
  mark(
    size,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </>,
    1.6,
    className,
  )

export const BlockMark = ({ size = 20, className }: { size?: number; className?: string }) =>
  mark(
    size,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>,
    1.6,
    className,
  )

export const BulbIcon = ({ size = 18, className }: { size?: number; className?: string }) =>
  mark(
    size,
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.5.7.5 1.1v1h6v-1c0-.4.1-.8.5-1.1A6 6 0 0 0 12 3z" />
    </>,
    1.5,
    className,
  )

export const TrophyIcon = ({ size = 16, className }: { size?: number; className?: string }) =>
  mark(
    size,
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
      <path d="M12 13v4M9 20h6M10 17h4" />
    </>,
    1.6,
    className,
  )
