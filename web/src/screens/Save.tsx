import { useNavigate } from 'react-router-dom'
import { DEMO_DISABLED, TopBar, useToast } from '../components/ui'
import { ChevronRight } from '../components/icons'
import { NAVY, useThemeColor } from '../lib/useThemeColor'
import { session } from '../lib/session'

const OPTIONS: { letter: string; name: string; tagline: string; to?: string }[] = [
  { letter: 'S', name: 'Sika Save', tagline: 'Save easily. Reach your goals.' },
  { letter: 'Y', name: 'YelloSave', tagline: 'Simple saving. Real results.' },
  { letter: 'A', name: 'Adawise', tagline: 'Build better financial habit', to: '/adawise' },
]

export function Save() {
  useThemeColor(NAVY)
  const navigate = useNavigate()
  const [toast, toastNode] = useToast()

  return (
    <div className="relative flex h-full flex-col bg-white">
      <TopBar title="Save" onBack={() => navigate(-1)} onClose={() => navigate('/home', { replace: true })} />

      <div className="min-h-0 flex-1 overflow-y-auto px-[19px] pb-8">
        <p className="mx-auto mt-[32px] max-w-[330px] text-center text-[16px] leading-[1.4] text-muted">
          Grow your money effortlessly through flexible savings offerings.
        </p>

        <ul className="mt-[26px] flex flex-col gap-[14px]">
          {OPTIONS.map((o) => (
            <li key={o.name}>
              <button
                type="button"
                aria-disabled={!o.to}
                onClick={() => {
                  if (!o.to) return toast(DEMO_DISABLED)
                  // First time in: Adawise welcome + terms, then the Adawise home
                  navigate(o.to === '/adawise' && !session.hasAcceptedAdawiseTerms() ? '/adawise/welcome' : o.to)
                }}
                className="flex h-[64px] w-full items-center gap-[12px] rounded-[14px] bg-white pl-[12px] pr-[14px] text-left shadow-[0_2px_14px_rgba(0,0,0,0.08)] transition active:scale-[0.99]"
              >
                <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[#e9e9e9] text-[15px] font-semibold text-navy">
                  {o.letter}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-navy">{o.name}</span>
                  <span className="block truncate text-[12px] text-ink">{o.tagline}</span>
                </span>
                <span className="text-yellow">
                  <ChevronRight size={22} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {toastNode}
    </div>
  )
}
