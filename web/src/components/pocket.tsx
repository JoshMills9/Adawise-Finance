// Emergency pocket pieces shared by Home, the goal screen and goal setup: the limit picker and the pocket sheet.
import { useEffect, useState } from 'react'
import { Chip, Field, PrimaryButton, Progress, Sheet } from './ada'
import { ghs } from '../lib/demoData'
import { EMERGENCY, setPocketCap, usePocket } from '../lib/emergency'
import { amountOf, cleanAmount } from '../lib/format'

/** The user picks where their pocket stops growing: a few common amounts, or their own */
export function PocketCapPicker({ value, onChange, balance }: { value: number; onChange: (cap: number) => void; balance: number }) {
  const preset = (EMERGENCY.capOptions as readonly number[]).includes(value)
  const [own, setOwn] = useState(!preset)
  const [text, setText] = useState(preset ? '' : String(value))
  const typed = amountOf(text)
  const tooSmall = own && text !== '' && typed < EMERGENCY.minCap

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {EMERGENCY.capOptions.map((n) => (
          <Chip
            key={n}
            selected={!own && value === n}
            onClick={() => {
              setOwn(false)
              onChange(n)
            }}
          >
            {ghs(n, 0)}
          </Chip>
        ))}
        <Chip selected={own} onClick={() => setOwn(true)}>
          Other
        </Chip>
      </div>
      {own && (
        <div className="mt-3">
          <Field
            label="Your limit"
            prefix="GHS"
            placeholder="0"
            inputMode="decimal"
            value={text}
            onChange={(e) => {
              const t = cleanAmount(e.target.value)
              setText(t)
              if (amountOf(t) >= EMERGENCY.minCap) onChange(amountOf(t))
            }}
            error={tooSmall}
            hint={tooSmall ? `At least ${ghs(EMERGENCY.minCap, 0)}` : undefined}
          />
        </div>
      )}
      {balance > value && <p className="mt-2 text-[12.5px] text-muted">You already have {ghs(balance)}. Nothing is taken out; the pocket just stops growing.</p>}
    </div>
  )
}

/** What the pocket is, its limit (the user's choice), and a way to withdraw from it */
export function PocketSheet({ open, onClose, onWithdraw }: { open: boolean; onClose: () => void; onWithdraw?: () => void }) {
  const pocket = usePocket()
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (open) setEditing(false)
  }, [open])

  return (
    <Sheet open={open} onClose={onClose} label="Emergency pocket">
      <h2 className="mt-4 text-[20px] font-bold text-ada-dark">Emergency pocket</h2>
      <p className="mt-1 text-[14px] text-muted">
        {ghs(pocket.balance)} of your {ghs(pocket.cap, 0)} limit
      </p>
      <Progress value={(pocket.balance / pocket.cap) * 100} />
      <ul className="mt-3 flex flex-col gap-2 text-[14px] leading-relaxed text-ink">
        <li>• Each goal can send a safety slice ({EMERGENCY.slices.slice(0, -1).join(', ')} or {EMERGENCY.slices.at(-1)}%) of every payment here. One payment, one schedule.</li>
        <li>• One pocket for all your goals. It stops growing at your limit; after that, 100% goes to your goals.</li>
        <li>• If life happens, the pocket pays first, instantly. Your goals stay whole.</li>
      </ul>

      <div className="mt-4 rounded-[14px] bg-[#f4f6f7] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-[14.5px] font-semibold text-ada-dark">Pocket limit</span>
            <span className="block text-[12.5px] text-muted">Stops growing at {ghs(pocket.cap, 0)}</span>
          </span>
          <button type="button" onClick={() => setEditing((e) => !e)} className="text-[14px] font-semibold text-ada active:opacity-60">
            {editing ? 'Done' : 'Change'}
          </button>
        </div>
        {editing && (
          <div className="mt-3">
            <PocketCapPicker value={pocket.cap} onChange={setPocketCap} balance={pocket.balance} />
          </div>
        )}
      </div>

      {onWithdraw && (
        <div className="mt-5">
          <PrimaryButton disabled={pocket.balance <= 0} onClick={onWithdraw}>
            Withdraw from pocket
          </PrimaryButton>
        </div>
      )}
      <p className="mt-2 text-center text-[12px] text-muted">Demo: the pocket is held in your Adawise wallet and set aside on this device.</p>
    </Sheet>
  )
}
