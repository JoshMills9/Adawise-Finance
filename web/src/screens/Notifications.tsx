import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeIcon, LifebuoyIcon, PlusIcon, UsersIcon, VaultIcon } from '../components/icons'
import { ADA_DARK, DetailHeader, HeartIcon, card, goBack } from '../components/ada'
import { shortDate, type Notice } from '../lib/demoData'
import { noticeStore, useNotices } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'

const ICON: Record<Notice['kind'], { icon: ReactNode; tone: string }> = {
  saveme: { icon: <LifebuoyIcon size={20} />, tone: 'bg-[#fff4d6] text-[#8a6300]' },
  invite: { icon: <UsersIcon size={20} />, tone: 'bg-ada-soft text-ada' },
  milestone: { icon: <VaultIcon size={20} />, tone: 'bg-ada-soft text-ada' },
  circle: { icon: <BadgeIcon size={20} />, tone: 'bg-ada-soft text-ada' },
  partner: { icon: <HeartIcon size={20} />, tone: 'bg-ada-soft text-ada' },
  money: { icon: <PlusIcon size={20} />, tone: 'bg-ada-soft text-ada' },
}

export function Notifications() {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  const notices = useNotices()
  const unread = notices.filter((n) => !n.read)
  const earlier = notices.filter((n) => n.read)

  // Opening the list counts as reading them (after a beat, so the "new" dots are visible first)
  useEffect(() => {
    const t = setTimeout(noticeStore.markAllRead, 1500)
    return () => clearTimeout(t)
  }, [])

  const Row = ({ n }: { n: Notice }) => (
    <button type="button" onClick={() => n.link && navigate(n.link)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
      <span className={`grid size-[40px] shrink-0 place-items-center rounded-full ${ICON[n.kind].tone}`}>{ICON[n.kind].icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[14.5px] leading-snug ${n.read ? 'text-ink' : 'font-semibold text-ink'}`}>{n.text}</span>
        <span className="mt-[2px] block text-[12.5px] text-muted">{shortDate(n.date)}</span>
      </span>
      {!n.read && <span className="mt-2 size-[9px] shrink-0 rounded-full bg-ada" aria-label="New" />}
    </button>
  )

  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className="min-h-0 flex-1 overflow-y-auto pb-8">
        <DetailHeader title="Notifications" onBack={() => goBack(navigate)}>
          <div className="h-6" />
        </DetailHeader>
        <div className="px-4 pt-4">
          {notices.length === 0 && <p className="py-10 text-center text-[14px] text-muted">No notifications yet.</p>}
          {unread.length > 0 && (
            <>
              <h2 className="mb-2 text-[15px] font-bold text-ink">New</h2>
              <div className={`${card} divide-y divide-[#eef0f1]`}>
                {unread.map((n) => (
                  <Row key={n.id} n={n} />
                ))}
              </div>
            </>
          )}
          {earlier.length > 0 && (
            <>
              <h2 className="mb-2 mt-6 text-[15px] font-bold text-ink">Earlier</h2>
              <div className={`${card} divide-y divide-[#eef0f1]`}>
                {earlier.map((n) => (
                  <Row key={n.id} n={n} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
