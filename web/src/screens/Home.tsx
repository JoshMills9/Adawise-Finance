import { useState, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { DEMO_DISABLED, PillButton, TextButton, useToast } from '../components/ui'
import { signOutAdawise } from '../lib/goalStore'
import { session } from '../lib/session'
import {
  AirtimeIcon,
  BellIcon,
  BillsIcon,
  BundlesIcon,
  CashOutIcon,
  DepositIcon,
  EyeIcon,
  EyeOffIcon,
  GiftIcon,
  HomeIcon,
  InsureIcon,
  InvestIcon,
  LoansIcon,
  MoreIcon,
  ProfileIcon,
  SaveIcon,
  ScanQrIcon,
  StatementsIcon,
  TransfersIcon,
} from '../components/icons'
import { NAVY, useThemeColor } from '../lib/useThemeColor'

// Dummy data — nothing here comes from a real account
const DEMO_BALANCE = 'GHS 1,250.00'
const DEMO_NOTIFICATIONS = 3
const DEMO_WALLET = '241234567'
const DEMO_NAME = 'Ama Mensah'

type Icon = ComponentType<{ size?: number }>

const SERVICES: { label: string; icon: Icon; to?: string }[] = [
  { label: 'Transfers', icon: TransfersIcon },
  { label: 'Bundles', icon: BundlesIcon },
  { label: 'Airtime', icon: AirtimeIcon },
  { label: 'Pay Bills', icon: BillsIcon },
  { label: 'Save', icon: SaveIcon, to: '/save' }, // the only live action
  { label: 'Invest', icon: InvestIcon },
  { label: 'Insure', icon: InsureIcon },
  { label: 'Loans & Advances', icon: LoansIcon },
]

const TABS = ['For you', 'Pay', 'Buy', 'Lifestyle']

export function Home() {
  useThemeColor(NAVY)
  const navigate = useNavigate()
  const [toast, toastNode] = useToast()
  const [showBalance, setShowBalance] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const off = () => toast(DEMO_DISABLED)

  const logOut = () => {
    session.signOut()
    signOutAdawise()
    navigate('/welcome', { replace: true })
  }

  // Always a dummy number, even if a real one was typed at sign-in
  const wallet = DEMO_WALLET

  return (
    <div className="relative flex h-full flex-col bg-[#ebebeb]">
      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(120px+env(safe-area-inset-bottom))]">
        {/* ---- White top section: header, wallet card, tabs ---- */}
        <section className="relative bg-white pb-2 shadow-[0_6px_10px_-6px_rgba(0,0,0,0.12)]">
          <div
            className="momo-gradient absolute inset-x-0 top-0 h-[calc(226px+env(safe-area-inset-top))]"
            style={{ borderBottomLeftRadius: '50% 22px', borderBottomRightRadius: '50% 22px' }}
          />

          {/* Top row */}
          <div className="relative flex items-center justify-between px-[18px] pt-[calc(env(safe-area-inset-top)+10px)]">
            <button type="button" aria-label="Profile" onClick={() => setProfileOpen(true)} className="text-yellow active:opacity-60">
              <ProfileIcon size={30} />
            </button>
            <img
              src="/brand/momo-icon.png"
              alt="MoMo"
              className="size-[44px] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
              draggable={false}
            />
            <button type="button" aria-label="Notifications" onClick={off} className="relative text-yellow active:opacity-60">
              <BellIcon size={30} />
              <span className="absolute -right-[6px] -top-[6px] grid h-[18px] min-w-[18px] place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-ink">
                {DEMO_NOTIFICATIONS}
              </span>
            </button>
          </div>

          {/* Wallet card */}
          <div className="relative mx-[19px] mt-[36px] overflow-hidden rounded-[12px] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.10)]">
            <span className="absolute left-0 top-0 rounded-br-[8px] bg-yellow px-[7px] py-[2px] text-[11px] font-semibold text-navy">
              Wallet
            </span>
            <div className="relative px-4 pb-[14px] pt-[18px] text-center">
              <p className="text-[15px] tracking-[0.06em] text-navy">{wallet}</p>
              <p className="mt-[2px] text-[27px] font-bold text-navy">{showBalance ? DEMO_BALANCE : 'GHS ******'}</p>
              <button
                type="button"
                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                onClick={() => setShowBalance((s) => !s)}
                className="absolute right-[16px] top-1/2 -translate-y-1/3 text-navy active:opacity-60"
              >
                {showBalance ? <EyeOffIcon size={30} /> : <EyeIcon size={30} />}
              </button>
            </div>
            <div className="grid grid-cols-3 border-t border-[#e6e6e6] py-[12px]">
              {[
                { label: 'Deposit', icon: DepositIcon },
                { label: 'Allow CashOut', icon: CashOutIcon },
                { label: 'Statements', icon: StatementsIcon },
              ].map(({ label, icon: I }, i) => (
                <button
                  key={label}
                  type="button"
                  aria-disabled
                  onClick={off}
                  className={`flex flex-col items-center gap-[6px] text-navy ${i > 0 ? 'border-l-[1.5px] border-yellow' : ''}`}
                >
                  <I size={25} />
                  <span className="text-[12.5px] font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="mt-[38px] flex gap-[8px] overflow-x-auto px-[19px] pb-2 [scrollbar-width:none]">
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={i === 0 ? undefined : off}
                className={`h-[40px] shrink-0 rounded-full px-[22px] text-[16px] font-bold uppercase tracking-[0.03em] ${
                  i === 0 ? 'min-w-[107px] bg-yellow text-navy' : 'text-[#b8b8b8]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* ---- Services grid ---- */}
        <section className="grid grid-cols-4 gap-x-[25px] gap-y-[12px] px-[19px] pt-[26px]">
          {SERVICES.map(({ label, icon: I, to }) => (
            <button
              key={label}
              type="button"
              aria-disabled={!to}
              onClick={() => (to ? navigate(to) : off())}
              className="group flex flex-col items-center"
            >
              <span className="grid aspect-square w-full place-items-center rounded-[12px] bg-white text-navy transition group-active:scale-95">
                <I size={34} />
              </span>
              <span className="mt-[8px] min-h-[36px] text-center text-[13.5px] leading-[1.25] text-navy">{label}</span>
            </button>
          ))}
        </section>
      </main>

      <BottomNav onDisabled={off} />
      <ProfileSheet open={profileOpen} wallet={wallet} onClose={() => setProfileOpen(false)} onLogOut={logOut} />
      {toastNode}
    </div>
  )
}

/** Slides up from the bottom when the profile icon is tapped */
function ProfileSheet({
  open,
  wallet,
  onClose,
  onLogOut,
}: {
  open: boolean
  wallet: string
  onClose: () => void
  onLogOut: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Profile"
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-[24px] bg-white px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-3"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
          >
            <div className="mx-auto h-[5px] w-[40px] rounded-full bg-[#d9d9d9]" />

            <div className="mt-6 flex items-center gap-4">
              <span className="grid size-[56px] place-items-center rounded-full bg-navy text-yellow">
                <ProfileIcon size={34} />
              </span>
              <div>
                <p className="text-[18px] font-bold text-navy">{DEMO_NAME}</p>
                <p className="mt-[2px] text-[15px] tracking-[0.06em] text-muted">{wallet}</p>
              </div>
            </div>

            <div className="mt-8">
              <PillButton onClick={onLogOut}>Log out</PillButton>
            </div>
            <div className="mt-2">
              <TextButton onClick={onClose}>Cancel</TextButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function BottomNav({ onDisabled }: { onDisabled: () => void }) {
  const item = (label: string, I: Icon, active = false) => (
    <button
      type="button"
      onClick={active ? undefined : onDisabled}
      className={`flex flex-1 flex-col items-center gap-[4px] pt-[14px] ${active ? 'text-navy' : 'text-[#6b7a86]'}`}
    >
      <I size={26} />
      <span className={`text-[13px] ${active ? 'font-bold' : ''}`}>{label}</span>
    </button>
  )

  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 rounded-t-[20px] bg-white pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="flex items-start">
        {item('Home', HomeIcon, true)}
        {item('Transfers', TransfersIcon)}
        <button type="button" onClick={onDisabled} className="relative flex flex-1 flex-col items-center pt-[42px]">
          <span className="absolute -top-[30px] grid size-[63px] place-items-center rounded-full bg-yellow text-navy shadow-[0_3px_10px_rgba(0,0,0,0.15)]">
            <ScanQrIcon size={34} />
          </span>
          <span className="text-[13px] text-[#6b7a86]">Scan QR</span>
        </button>
        {item('Offers', GiftIcon)}
        {item('More', MoreIcon)}
      </div>
    </nav>
  )
}
