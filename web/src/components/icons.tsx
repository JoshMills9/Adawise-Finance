// Line icons drawn to match MoMo's style (thin navy strokes, rounded joins)
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 28, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const ProfileIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="10.5" />
    <circle cx="12" cy="9.5" r="3.5" />
    <path d="M5.5 19c1.4-2.8 3.8-4.2 6.5-4.2s5.1 1.4 6.5 4.2" />
  </Base>
)

export const BellIcon = (p: P) => (
  <Base {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.8h-15z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Base>
)

export const EyeIcon = (p: P) => (
  <Base {...p}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="3.2" />
  </Base>
)

export const EyeOffIcon = (p: P) => (
  <Base {...p}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M4 4l16 16" />
  </Base>
)

export const DepositIcon = (p: P) => (
  <Base {...p}>
    <rect x="4" y="8" width="12" height="10" rx="2" />
    <path d="M7 8V6.5A1.5 1.5 0 0 1 8.5 5H12" />
    <path d="M21 13h-5m2-2-2 2 2 2" />
  </Base>
)

export const CashOutIcon = (p: P) => (
  <Base {...p}>
    <rect x="4" y="8" width="12" height="10" rx="2" />
    <path d="M7 8V6.5A1.5 1.5 0 0 1 8.5 5H12" />
    <path d="M16 13h5m-2-2 2 2-2 2" />
  </Base>
)

export const StatementsIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 8h16m-4-4 4 4-4 4" />
    <path d="M20 16H4m4-4-4 4 4 4" />
  </Base>
)

export const TransfersIcon = (p: P) => (
  <Base {...p}>
    <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
    <path d="M21 3 10 13" />
  </Base>
)

export const BundlesIcon = (p: P) => (
  <Base {...p}>
    <path d="M2.5 9a14 14 0 0 1 19 0" />
    <path d="M5.5 12.5a9.5 9.5 0 0 1 13 0" />
    <path d="M8.5 16a5 5 0 0 1 7 0" />
    <circle cx="12" cy="19.2" r="0.6" fill="currentColor" />
  </Base>
)

export const AirtimeIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 4.5 7.5 4l2 4.5L8 10a10 10 0 0 0 5 5l1.5-1.5 4.5 2-.5 2.5a2 2 0 0 1-2 1.5A14 14 0 0 1 3.5 6.5 2 2 0 0 1 5 4.5z" />
    <rect x="13" y="3" width="8" height="6" rx="1.5" />
    <path d="M15 6h.01M17 6h.01M19 6h.01" strokeWidth={1.8} />
  </Base>
)

export const BillsIcon = (p: P) => (
  <Base {...p}>
    <path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3L6 21z" />
    <path d="M9 8h6M9 11.5h6M9 15h3" />
    <path d="M18 5h1.5A1.5 1.5 0 0 1 21 6.5V8h-3" />
  </Base>
)

export const SaveIcon = (p: P) => (
  <Base {...p}>
    <rect x="4" y="3" width="10" height="3" rx="1" />
    <path d="M5 6v12a2 2 0 0 0 2 2h5" />
    <path d="M13 6v3" />
    <path d="M5 10h4M5 14h4" />
    <circle cx="16.5" cy="15.5" r="4.5" />
    <path d="M17.6 13.6h-1.6a.9.9 0 0 0 0 1.8h1a.9.9 0 0 1 0 1.8h-1.6M16.5 13v.6M16.5 17.2v.6" />
  </Base>
)

export const InvestIcon = (p: P) => (
  <Base {...p}>
    <path d="M3 3v18h18" />
    <path d="M6 16l4-5 3 3 6-7" />
    <path d="M15 7h4v4" />
  </Base>
)

export const InsureIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z" />
    <path d="M12 12v6.5a2 2 0 0 1-4 0" />
    <path d="M12 2v1" />
  </Base>
)

export const LoansIcon = (p: P) => (
  <Base {...p}>
    <circle cx="14" cy="6.5" r="3.8" />
    <path d="M14.7 5.2H13.6a.7.7 0 0 0 0 1.4h.8a.7.7 0 0 1 0 1.4h-1.1M14 4.3v.6M14 8.5v.6" />
    <path d="M3 14h3l3.5-1H13a1.5 1.5 0 0 1 0 3H10" />
    <path d="M6 20h7l7-4a1.5 1.5 0 0 0-1.5-2.5L14 15.5" />
    <path d="M3 13v8" />
  </Base>
)

export const HomeIcon = (p: P) => (
  <svg width={p.size ?? 26} height={p.size ?? 26} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.8 2.5 10.6V21a1 1 0 0 0 1 1h5.5v-6.5h6V22h5.5a1 1 0 0 0 1-1V10.6z" />
  </svg>
)

export const GiftIcon = (p: P) => (
  <Base {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v9h14v-9M12 8v13" />
    <path d="M12 8C10 4 6.5 4.5 7 6.8 7.4 8 12 8 12 8zm0 0c2-4 5.5-3.5 5-1.2C16.6 8 12 8 12 8z" />
  </Base>
)

export const MoreIcon = (p: P) => (
  <Base {...p}>
    <circle cx="5" cy="12" r="2.2" />
    <circle cx="12" cy="12" r="2.2" />
    <circle cx="19" cy="12" r="2.2" />
  </Base>
)

export const ScanQrIcon = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <circle cx="6.5" cy="6.5" r="4" />
    <circle cx="17.5" cy="6.5" r="4" />
    <circle cx="6.5" cy="17.5" r="4" />
    <g fill="currentColor" stroke="none">
      <circle cx="14.6" cy="14.6" r="1.9" />
      <circle cx="20.4" cy="14.6" r="1.9" />
      <circle cx="14.6" cy="20.4" r="1.9" />
      <circle cx="20.4" cy="20.4" r="1.9" />
    </g>
  </svg>
)

export const FlagIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </Base>
)

export const UsersIcon = (p: P) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16.5 14.6c2.4.2 4.2 1.9 5 4.9" />
  </Base>
)

export const LockIcon = (p: P) => (
  <Base {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <path d="M12 14.5v2" />
  </Base>
)

export const ClockIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Base>
)

export const DropletIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z" />
  </Base>
)

export const PlusIcon = (p: P) => (
  <Base strokeWidth={1.8} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)

export const LifebuoyIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />
  </Base>
)

export const BadgeIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="9" r="6" />
    <path d="M8.5 14 7 21l5-2.5 5 2.5-1.5-7" />
    <path d="M12 6.5l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z" />
  </Base>
)

export const VaultIcon = (p: P) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="15" rx="2.5" />
    <circle cx="12" cy="11.5" r="3.5" />
    <path d="M12 8v1M12 14v1M15.5 11.5h-1M9.5 11.5h-1M6 19v1.5M18 19v1.5" />
  </Base>
)

export const WalletIcon = (p: P) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H17a1 1 0 0 1 0 2H6.5a.5.5 0 0 0 0 1H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 17.5zM16.5 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
  </svg>
)

export const ChevronRight = (p: P) => (
  <Base strokeWidth={1.6} {...p}>
    <path d="M9 4l8 8-8 8" />
  </Base>
)

export const SearchIcon = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Base>
)
