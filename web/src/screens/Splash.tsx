import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MomoLogo } from '../components/ui'
import { session } from '../lib/session'
import { resetAdawise } from "../lib/goalStore"
import { NAVY, useThemeColor } from '../lib/useThemeColor'

export function Splash() {
  useThemeColor(NAVY)
  const navigate = useNavigate()

  useEffect(() => {
    // Open the app with ?reset to replay onboarding during a demo
    if (new URLSearchParams(window.location.search).has('reset')) {
      session.reset()
      resetAdawise()
    }

    const t = setTimeout(() => {
      const next = session.isSignedIn() ? '/home' : session.isOnboarded() ? '/welcome' : '/onboarding'
      navigate(next, { replace: true })
    }, 1800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="grid h-full place-items-center bg-navy">
      <MomoLogo iconSize={64} />
    </div>
  )
}
