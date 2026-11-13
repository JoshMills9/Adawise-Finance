import { useNavigate } from 'react-router-dom'
import { ADA_DARK, DetailHeader, EmptyState, PrimaryButton, card, goBack } from '../components/ada'
import { ClockIcon, UsersIcon } from '../components/icons'
import { ghs } from '../lib/demoData'
import { noticeStore, useGoals, useSupporting } from '../lib/goalStore'
import { useToast } from '../components/ui'
import { useThemeColor } from '../lib/useThemeColor'
import { ContributionRow, SupportedCard, upcoming } from './Adawise'

function ListShell({ title, subtitle, children, cta }: { title: string; subtitle: string; children: React.ReactNode; cta?: { label: string; to: string } }) {
  useThemeColor(ADA_DARK)
  const navigate = useNavigate()
  return (
    <div className="font-ada relative flex h-full flex-col bg-[#f4f6f7]">
      <main className="min-h-0 flex-1 overflow-y-auto pb-8">
        <DetailHeader title={title} onBack={() => goBack(navigate)}>
          <p className="pb-8 text-center text-[14px] text-white/75">{subtitle}</p>
        </DetailHeader>
        <div className="px-4 pt-4">{children}</div>
      </main>
      {cta && (
        <div className="shrink-0 border-t border-[#e6ebec] bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
          <PrimaryButton onClick={() => navigate(cta.to)}>{cta.label}</PrimaryButton>
        </div>
      )}
    </div>
  )
}

const money = (n: number) => ghs(n)

export function ContributionsList() {
  const navigate = useNavigate()
  const list = upcoming(useGoals())
  const due = list.reduce((s, g) => s + g.nextContribution!.amount, 0)
  return (
    <ListShell title="Next contributions" subtitle={`${list.length} upcoming · ${ghs(due)} in total`}>
      <div className={`${card} divide-y divide-[#eef0f1] overflow-hidden`}>
        {list.map((g) => (
          <ContributionRow key={g.id} goal={g} money={money} onOpen={() => navigate(`/adawise/goal/${g.id}`)} onPay={() => navigate(`/adawise/goal/${g.id}?action=add`)} />
        ))}
        {list.length === 0 && (
          <EmptyState icon={<ClockIcon size={28} />} title="Nothing due" text="When a goal has a saving plan, its next payment shows up here." />
        )}
      </div>
    </ListShell>
  )
}

export function SupportingList() {
  const supporting = useSupporting()
  const [toast, toastNode] = useToast()
  return (
    <ListShell title="Goals you support" subtitle={`You're an accountability partner on ${supporting.length} goal${supporting.length === 1 ? '' : 's'}`}>
      <div className="flex flex-col gap-3">
        {supporting.map((sg) => (
          <SupportedCard
            key={sg.id}
            goal={sg}
            onCheer={() => {
              noticeStore.push({ kind: 'partner', text: `You cheered on ${sg.person} for ${sg.goalName}` })
              toast(`Encouragement sent to ${sg.person}`)
            }}
          />
        ))}
        {supporting.length === 0 && (
          <div className={card}>
            <EmptyState icon={<UsersIcon size={28} />} title="No goals to support yet" text="When someone makes you their accountability partner, their goal shows up here." />
          </div>
        )}
      </div>
      {toastNode}
    </ListShell>
  )
}
