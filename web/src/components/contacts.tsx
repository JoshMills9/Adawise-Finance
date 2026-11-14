// Adding people by name and MoMo number. Everyone added is saved to the user's contacts
// (lib/goalStore.ts) so they can be picked again next time.
import { useState } from 'react'
import { Field } from './ada'
import { auth } from '../lib/api'
import { isPhone, toE164 } from '../lib/format'
import { contactStore, type Contact } from '../lib/goalStore'

export function AddContact({
  onAdd,
  disabled,
  taken = [],
  defaultOpen = false,
  action = 'Add',
}: {
  onAdd: (c: Contact) => void
  disabled?: boolean
  /** Phone numbers already picked here */
  taken?: string[]
  /** Start with the form showing (e.g. when there are no saved contacts yet) */
  defaultOpen?: boolean
  action?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const valid = isPhone(phone)
  const mine = valid && toE164(phone) === toE164(auth.user()?.phone ?? '')
  const dupe = valid && taken.some((t) => toE164(t) === toE164(phone))
  const problem = mine ? "That's your own number" : dupe ? 'Already added' : ''
  const ok = name.trim().length > 0 && valid && !problem && !disabled

  const add = () => {
    if (!ok) return
    onAdd(contactStore.save({ name, phone }))
    setName('')
    setPhone('')
    setOpen(defaultOpen)
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="mt-3 h-[44px] w-full rounded-[14px] border-2 border-dashed border-[#c5d0d1] text-[14.5px] font-semibold text-ada disabled:text-[#a3adae]"
      >
        + Add someone new
      </button>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <Field label="Name" placeholder="e.g. Ama Mensah" autoComplete="off" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} />
      <Field
        label="MoMo number"
        placeholder="24 000 0000"
        inputMode="tel"
        prefix="+233"
        value={phone}
        error={!!problem}
        hint={problem || 'Saved to your contacts for next time'}
        onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 12))}
      />
      <div className="flex gap-2">
        {!defaultOpen && (
          <button type="button" onClick={() => setOpen(false)} className="h-[46px] flex-1 rounded-full text-[15px] font-semibold text-muted">
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={!ok}
          onClick={add}
          className="h-[46px] flex-1 rounded-full border-2 border-ada text-[15px] font-semibold text-ada transition disabled:border-[#c5d0d1] disabled:text-[#a3adae]"
        >
          {action}
        </button>
      </div>
    </div>
  )
}
