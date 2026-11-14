// Circles other people have invited you to. Joining makes you a goal in the circle; declining just drops the invite.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from './ui'
import { Glyph } from './goalIcons'
import { acceptCircleInvite, declineCircleInvite, errorText } from '../lib/adawise'
import { ghs } from '../lib/demoData'
import { firstName } from '../lib/format'
import { useCircleInvites, type CircleInvite } from '../lib/goalStore'

export function CircleInvites() {
  const invites = useCircleInvites()
  const [toast, toastNode] = useToast()
  if (invites.length === 0) return toastNode

  return (
    <section className="px-4 pt-4">
      <p className="mb-2 text-[14px] font-semibold text-ada-dark">
        Circle invites <span className="ml-1 rounded-full bg-ada-soft px-2 py-[2px] text-[12px] text-ada-dark">{invites.length}</span>
      </p>
      <div className="flex flex-col gap-3">
        {invites.map((i) => (
          <InviteCard key={i.id} invite={i} onToast={toast} />
        ))}
      </div>
      {toastNode}
    </section>
  )
}

function InviteCard({ invite: i, onToast }: { invite: CircleInvite; onToast: (m: string) => void }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState<null | 'join' | 'decline'>(null)
  const owner = firstName(i.ownerName) || 'Someone'

  const join = async () => {
    setBusy('join')
    try {
      const circle = await acceptCircleInvite(i.id)
      navigate(`/adawise/circle/${circle.id}`)
    } catch (e) {
      onToast(errorText(e))
      setBusy(null)
    }
  }
  const decline = async () => {
    setBusy('decline')
    try {
      await declineCircleInvite(i.id)
      onToast(`Declined ${i.circleName}`)
    } catch (e) {
      onToast(errorText(e))
      setBusy(null)
    }
  }

  return (
    <div className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="flex items-center gap-2 text-[16px] font-bold text-ada-dark">
        <Glyph name={i.icon} size={18} className="shrink-0 text-ada" />
        <span className="min-w-0 truncate">{i.circleName}</span>
      </p>
      <p className="mt-1 text-[13.5px] text-muted">
        {owner} invited you to save {ghs(i.target, 0)} each, together.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void decline()}
          className="h-[40px] flex-1 rounded-full border-2 border-[#c5d0d1] text-[14px] font-semibold text-muted disabled:opacity-60"
        >
          {busy === 'decline' ? 'Declining…' : 'Decline'}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void join()}
          className="h-[40px] flex-1 rounded-full bg-ada text-[14px] font-semibold text-white active:brightness-110 disabled:opacity-60"
        >
          {busy === 'join' ? 'Joining…' : 'Join circle'}
        </button>
      </div>
    </div>
  )
}
