// Adding people by name and MoMo number. Everyone added is saved to the user's contacts
// (lib/goalStore.ts) so they can be picked again next time.
import { useState } from 'react'
import { Field } from './ada'
import { auth } from '../lib/api'
import { isPhone, toE164 } from '../lib/format'
import { contactStore, type Contact } from '../lib/goalStore'

// Contact Picker API (Chrome / Samsung Internet on Android). Not in TypeScript's DOM types yet.
// It opens the phone's own picker and hands back only the people the user chooses.
type PickedContact = { name?: string[]; tel?: string[] }
type ContactsManager = { select: (props: ('name' | 'tel')[], opts?: { multiple?: boolean }) => Promise<PickedContact[]> }
const phoneContacts = typeof navigator !== 'undefined' ? (navigator as Navigator & { contacts?: ContactsManager }).contacts : undefined
export const canPickPhoneContacts = !!phoneContacts?.select

/** "+233 24 412 3456" / "0244123456" → "24 412 3456", the way the number field takes it */
function toField(raw: string) {
  const d = toE164(raw).slice(4)
  return isPhone(raw) ? `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}` : raw.replace(/[^\d ]/g, '').slice(0, 12)
}

export function AddContact({
  onAdd,
  disabled,
  taken = [],
  defaultOpen = false,
  action = 'Add',
  fromPhone = false,
}: {
  onAdd: (c: Contact) => void
  disabled?: boolean
  /** Phone numbers already picked here */
  taken?: string[]
  /** Start with the form showing (e.g. when there are no saved contacts yet) */
  defaultOpen?: boolean
  action?: string
  /** Offer the phone's contact picker where the browser has one */
  fromPhone?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notGhana, setNotGhana] = useState(false)
  const picker = fromPhone && canPickPhoneContacts && !disabled

  const valid = isPhone(phone)
  const mine = valid && toE164(phone) === toE164(auth.user()?.phone ?? '')
  const dupe = valid && taken.some((t) => toE164(t) === toE164(phone))
  const problem = mine ? "That's your own number" : dupe ? 'Already added' : notGhana ? 'Use a Ghana mobile number' : ''
  const ok = name.trim().length > 0 && valid && !problem && !disabled

  const add = () => {
    if (!ok) return
    onAdd(contactStore.save({ name, phone }))
    setName('')
    setPhone('')
    setNotGhana(false)
    setOpen(defaultOpen)
  }

  // One person at a time: their details fill the form so they're checked like any other entry
  const pick = async () => {
    try {
      const [c] = (await phoneContacts!.select(['name', 'tel'])) ?? []
      if (!c) return
      const tels = c.tel ?? []
      const tel = tels.find(isPhone) ?? tels[0] ?? ''
      setName((c.name?.[0] ?? '').trim().slice(0, 60))
      setPhone(toField(tel))
      setNotGhana(!!tel && !isPhone(tel))
      setOpen(true)
    } catch {
      // Picker already open or blocked; the form still works
    }
  }

  const pickButton = picker && (
    <button
      type="button"
      onClick={pick}
      className="h-[44px] w-full rounded-[14px] bg-ada-soft text-[14.5px] font-semibold text-ada-dark active:opacity-70"
    >
      Choose from phone contacts
    </button>
  )

  if (!open) {
    return (
      <>
      {pickButton && <div className="mt-3">{pickButton}</div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="mt-3 h-[44px] w-full rounded-[14px] border-2 border-dashed border-[#c5d0d1] text-[14.5px] font-semibold text-ada disabled:text-[#a3adae]"
      >
        + Add someone new
      </button>
      </>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      {pickButton}
      <Field label="Name" placeholder="e.g. Ama Mensah" autoComplete="off" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} />
      <Field
        label="MoMo number"
        placeholder="24 000 0000"
        inputMode="tel"
        prefix="+233"
        value={phone}
        error={!!problem}
        hint={problem || 'Saved to your contacts for next time'}
        onChange={(e) => {
          setNotGhana(false)
          setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 12))
        }}
      />
      <div className="flex gap-2">
        {!defaultOpen && (
          <button type="button" onClick={() => (setOpen(false), setNotGhana(false))} className="h-[46px] flex-1 rounded-full text-[15px] font-semibold text-muted">
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
