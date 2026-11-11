import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADA_DARK, Chip, DetailHeader, PrimaryButton, card, goBack } from '../components/ada'
import { GOAL_TYPE_LABEL, ghs, type GoalType } from '../lib/demoData'
import { useCircles, useGoals } from '../lib/goalStore'
import { useThemeColor } from '../lib/useThemeColor'
import { CircleCard, ContributionRow, GoalCard, upcoming } from './Adawise'

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

export function GoalsList() {
  const navigate = useNavigate()
  const goals = useGoals()
  const [filter, setFilter] = useState<GoalType | 'all'>('all')
  const shown = filter === 'all' ? goals : goals.filter((g) => g.type === filter)
  const total = goals.reduce((s, g) => s + g.saved, 0)

  return (
    <ListShell title="My goals" subtitle={`${goals.length} goals · ${ghs(total)} saved`} cta={{ label: '+ Create goal', to: '/adawise/new-goal' }}>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        {(['all', 'flexible', 'goal-locked', 'time-locked'] as const).map((t) => (
          <Chip key={t} selected={filter === t} onClick={() => setFilter(t)}>
            {t === 'all' ? `All (${goals.length})` : GOAL_TYPE_LABEL[t]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {shown.map((g) => (
          <GoalCard key={g.id} goal={g} money={money} onClick={() => navigate(`/adawise/goal/${g.id}`)} />
        ))}
        {shown.length === 0 && <p className="py-10 text-center text-[14px] text-muted">No {filter === 'all' ? '' : GOAL_TYPE_LABEL[filter as GoalType].toLowerCase()} goals yet.</p>}
      </div>
    </ListShell>
  )
}

export function CirclesList() {
  const navigate = useNavigate()
  const circles = useCircles()
  return (
    <ListShell title="My circles" subtitle={`${circles.length} WiseCircle${circles.length === 1 ? '' : 's'}`} cta={{ label: '+ Create circle', to: '/adawise/new-circle' }}>
      <div className="flex flex-col gap-3">
        {circles.map((c) => (
          <CircleCard key={c.id} circle={c} onClick={() => navigate(`/adawise/circle/${c.id}`)} />
        ))}
      </div>
    </ListShell>
  )
}

export function ContributionsList() {
  const navigate = useNavigate()
  const list = upcoming(useGoals())
  const due = list.reduce((s, g) => s + g.nextContribution!.amount, 0)
  return (
    <ListShell title="Next contributions" subtitle={`${list.length} upcoming · ${ghs(due)} in total`}>
      <div className={`${card} divide-y divide-[#eef0f1] overflow-hidden`}>
        {list.map((g) => (
          <ContributionRow key={g.id} goal={g} money={money} onPay={() => navigate(`/adawise/goal/${g.id}?action=add`)} />
        ))}
        {list.length === 0 && <p className="px-4 py-8 text-center text-[14px] text-muted">Nothing due. Nice work!</p>}
      </div>
    </ListShell>
  )
}
