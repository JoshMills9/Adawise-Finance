import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { Footer, Illustration, PillButton, TextButton } from '../components/ui'
import { session } from '../lib/session'
import { WHITE, useThemeColor } from '../lib/useThemeColor'

const SLIDES = [
  { id: 'topup', title: 'Top up', body: 'Buy electricity vouchers and airtime, data and voice bundles.' },
  { id: 'bills', title: 'Pay bills', body: 'Pay your electricity, TV subscriptions, water, school fees and tax bills.' },
  { id: 'scan', title: 'Scan to pay', body: 'Pay merchants and retailers by scanning a QR code.' },
  {
    id: 'send',
    title: 'Send & receive money',
    body: 'Send and receive money with any MTN mobile number, and get funds from friends and family worldwide.',
  },
]

export function Onboarding() {
  useThemeColor(WHITE)
  const navigate = useNavigate()
  const [emblaRef, embla] = useEmblaCarousel({ loop: false })
  const [index, setIndex] = useState(0)
  const isLast = index === SLIDES.length - 1

  useEffect(() => {
    if (!embla) return
    const onSelect = () => setIndex(embla.selectedScrollSnap())
    embla.on('select', onSelect)
    return () => {
      embla.off('select', onSelect)
    }
  }, [embla])

  const finish = useCallback(() => {
    session.markOnboarded()
    navigate('/welcome', { replace: true })
  }, [navigate])

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Slides */}
      <div ref={emblaRef} className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full">
          {SLIDES.map((s) => (
            <section
              key={s.id}
              className="flex h-full min-w-0 flex-[0_0_100%] flex-col items-center px-8 pt-[calc(env(safe-area-inset-top)+30px)] text-center narrow:px-5 short:pt-[calc(env(safe-area-inset-top)+12px)]"
            >
              {/* Supplied art has ~9% white margin around the circle, hence the larger box */}
              <Illustration name={s.id} label={s.title} size="min(350px, calc(52dvh - 120px), 86vw)" />
              <h2 className="mt-[clamp(8px,3dvh,26px)] text-[clamp(23px,7vw,28px)] font-semibold leading-tight text-navy">{s.title}</h2>
              <p className="mt-6 text-[clamp(15.5px,4.8vw,18px)] leading-[1.9] text-muted short:mt-3 short:leading-[1.6]">{s.body}</p>
            </section>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex shrink-0 items-center justify-center gap-[12px] pb-[24px] pt-3 short:pb-[12px] short:pt-1" role="tablist">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}`}
            onClick={() => embla?.scrollTo(i)}
            className={`h-[5px] rounded-full transition-all duration-300 ${i === index ? 'w-[15px] bg-yellow' : 'w-[5px] bg-dot'}`}
          />
        ))}
      </div>

      <Footer>
        <PillButton onClick={() => (isLast ? finish() : embla?.scrollNext())}>{isLast ? 'Get started' : 'Next'}</PillButton>
        {/* Keep the space on the last slide so the button doesn't jump */}
        <div className="mt-[14px] short:mt-1">{isLast ? <div className="h-[56px] short:h-[44px]" /> : <TextButton onClick={finish}>Skip</TextButton>}</div>
      </Footer>
    </div>
  )
}
