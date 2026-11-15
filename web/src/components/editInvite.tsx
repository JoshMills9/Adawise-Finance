// Changing someone's name, number (and for a goal partner, role) while their invite is still waiting.
// Only what changed is sent. A new number gets a fresh SMS link, so the old link stops working.
import { useEffect, useState } from 'react'
import { Field, HeartIcon, Option, PrimaryButton, Sheet } from './ada'
import { UsersIcon } from './icons'
import { isPhone, toE164 } from '../lib/format'
import { errorText, type InvitePatch } from '../lib/adawise'
import { toField } from './contacts'

type Role = 'saver' | 'supporter'

export function EditInviteSheet({
  open,
  title,
  initialName,
  initialPhone = '',
  initialRole,
  onSave,
  onClose,
  onToast,
}: {
  open: boolean
  title: string
  initialName: string
  /** Leave empty when the API doesn't tell us the number (then a blank field means "keep it") */
  initialPhone?: string
  /** Pass for goal partners to let the role change too */
  initialRole?: Role
  onSave: (patch: InvitePatch & { role?: Role }) => Promise<void>
  onClose: () => void
  onToast: (m: string) => void
}) {
  const startPhone = initialPhone ? toField(initialPhone) : ''
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(startPhone)
  const [role, setRole] = useState<Role | undefined>(initialRole)
  const [busy, setBusy] = useState(false)

  // Start from what the invite has now each time the sheet opens
  useEffect(() => {
    if (!open) return
    setName(initialName)
    setPhone(startPhone)
    setRole(initialRole)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const phoneChanged = phone.trim() !== startPhone && phone.trim() !== ''
  const badPhone = phoneChanged && !isPhone(phone)
  const nameChanged = name.trim() !== initialName
  const roleChanged = !!initialRole && role !== initialRole
  const ok = name.trim().length > 0 && !badPhone && (nameChanged || phoneChanged || roleChanged) && !busy

  const save = async () => {
    if (!ok) return
    setBusy(true)
    try {
      await onSave({
        ...(nameChanged && { name: name.trim() }),
        ...(phoneChanged && { phone: toE164(phone) }),
        ...(roleChanged && { role }),
      })
      onToast('Invite updated')
      onClose()
    } catch (e) {
      onToast(errorText(e)) // e.g. it was already answered, the number is taken, or the daily invite limit
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={() => !busy && onClose()} label={title}>
      <h2 className="mt-4 text-[20px] font-bold text-ada-dark">{title}</h2>
      <p className="mt-1 text-[14px] text-muted">Only works until they answer.</p>
      <div className="mt-4 flex flex-col gap-3">
        <Field label="Name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} />
        <Field
          label="MoMo number"
          placeholder={initialPhone ? '24 000 0000' : 'Leave blank to keep their number'}
          inputMode="tel"
          prefix="+233"
          value={phone}
          error={badPhone}
          hint={badPhone ? 'Use a Ghana mobile number' : phoneChanged ? 'A new number gets a fresh invite by SMS' : undefined}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 12))}
        />
      </div>
      {initialRole && (
        <div className="mt-4 flex flex-col gap-3">
          <Option selected={role === 'saver'} onClick={() => setRole('saver')} icon={UsersIcon} title="Save with me" desc="They save towards their own goal alongside you in a WiseCircle." />
          <Option selected={role === 'supporter'} onClick={() => setRole('supporter')} icon={HeartIcon} title="Cheer me on" desc="They follow your progress, encourage you and can help through Save Me." />
        </div>
      )}
      <div className="mt-5">
        <PrimaryButton disabled={!ok} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save changes'}
        </PrimaryButton>
      </div>
    </Sheet>
  )
}
