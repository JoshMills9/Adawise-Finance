// "How to identify your accountability partner": a link that opens a short guide in a bottom sheet.
import { PrimaryButton, Sheet } from './ada'

const QUESTIONS = [
  "Who do you turn to when you're facing financial difficulties or need to borrow money?",
  'Who do you trust with your personal goals?',
  'Who encourages you and keeps you accountable?',
  'Who genuinely wants to see you succeed at your financial goals?',
]

export function PartnerGuideLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 text-left text-[14px] font-semibold text-ada underline underline-offset-[3px] active:opacity-60">
      How to identify your accountability partner
    </button>
  )
}

/** Render this at the screen's root (the sheet is positioned against it) */
export function PartnerGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="How to identify your accountability partner">
      <h2 className="mt-4 text-[20px] font-bold text-ada-dark">How to identify your accountability partner</h2>
      <ol className="mt-4 flex flex-col gap-3">
        {QUESTIONS.map((q, i) => (
          <li key={q} className="flex gap-3 text-[14.5px] leading-snug text-ink">
            <span className="grid size-[24px] shrink-0 place-items-center rounded-full bg-[#eef0f1] text-[12.5px] font-bold text-ada-dark">{i + 1}</span>
            <span className="pt-[2px]">{q}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-[14px] bg-[#f1f3f4] px-4 py-3 text-[13.5px] leading-relaxed text-ink">Choose someone you trust and who will support you on your savings journey.</p>
      <div className="mt-5">
        <PrimaryButton onClick={onClose}>Got it</PrimaryButton>
      </div>
    </Sheet>
  )
}
