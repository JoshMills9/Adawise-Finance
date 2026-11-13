import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Splash } from './screens/Splash'
import { Onboarding } from './screens/Onboarding'
import { Welcome } from './screens/Welcome'
import { IdentityCheck } from './screens/IdentityCheck'
import { Otp } from './screens/Otp'
import { Home } from './screens/Home'
import { Save } from './screens/Save'
import { Adawise } from './screens/Adawise'
import { NewGoal } from './screens/NewGoal'
import { GoalDetail } from './screens/GoalDetail'
import { NewCircle } from './screens/NewCircle'
import { CircleDetail } from './screens/CircleDetail'
import { RequestDetail, RequestsList } from './screens/Requests'
import { Notifications } from './screens/Notifications'
import { ContributionsList, SupportingList } from './screens/Lists'
import { CirclesTab, GoalsTab, ProfileTab, isAdaTab } from './screens/AdaTabs'
import { Badges } from './screens/Badges'
import { Credit } from './screens/Credit'
import { AdawiseLogin, AdawiseTerms, AdawiseWelcome } from './screens/AdawiseIntro'
import { auth, UNAUTHORIZED_EVENT } from './lib/api'
import { session } from './lib/session'

/** Adawise screens need the terms accepted and an Adawise session */
function Ada({ children }: { children: ReactNode }) {
  if (!session.hasAcceptedAdawiseTerms()) return <Navigate to="/adawise/welcome" replace />
  if (!auth.isSignedIn()) return <Navigate to="/adawise/login" replace />
  return children
}

export function App() {
  const location = useLocation()
  const navigate = useNavigate()

  // The backend rejected the token: sign in to Adawise again
  useEffect(() => {
    const onExpired = () => navigate('/adawise/login', { replace: true })
    window.addEventListener(UNAUTHORIZED_EVENT, onExpired)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onExpired)
  }, [navigate])

  return (
    // Phone-width column: full screen on mobile, centred "device" on desktop
    <div className="fixed inset-y-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 overflow-hidden bg-white shadow-[0_0_40px_rgba(0,0,0,0.12)]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          // Switching between Adawise tabs swaps in place; everything else slides
          key={isAdaTab(location.pathname) ? 'adawise-tabs' : location.pathname}
          className="absolute inset-0"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <Routes location={location}>
            <Route path="/" element={<Splash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/verify" element={<IdentityCheck />} />
            <Route path="/otp" element={<Otp />} />
            <Route path="/home" element={<Home />} />
            <Route path="/save" element={<Save />} />
            <Route path="/adawise/welcome" element={<AdawiseWelcome />} />
            <Route path="/adawise/terms" element={<AdawiseTerms />} />
            <Route path="/adawise/login" element={<AdawiseLogin />} />
            <Route path="/adawise" element={<Ada><Adawise /></Ada>} />
            <Route path="/adawise/new-goal" element={<Ada><NewGoal /></Ada>} />
            <Route path="/adawise/goal/:id" element={<Ada><GoalDetail /></Ada>} />
            <Route path="/adawise/new-circle" element={<Ada><NewCircle /></Ada>} />
            <Route path="/adawise/circle/:id" element={<Ada><CircleDetail /></Ada>} />
            <Route path="/adawise/requests" element={<Ada><RequestsList /></Ada>} />
            <Route path="/adawise/requests/:id" element={<Ada><RequestDetail /></Ada>} />
            <Route path="/adawise/notifications" element={<Ada><Notifications /></Ada>} />
            <Route path="/adawise/goals" element={<Ada><GoalsTab /></Ada>} />
            <Route path="/adawise/circles" element={<Ada><CirclesTab /></Ada>} />
            <Route path="/adawise/profile" element={<Ada><ProfileTab /></Ada>} />
            <Route path="/adawise/badges" element={<Ada><Badges /></Ada>} />
            <Route path="/adawise/loan" element={<Ada><Credit /></Ada>} />
            <Route path="/adawise/contributions" element={<Ada><ContributionsList /></Ada>} />
            <Route path="/adawise/supporting" element={<Ada><SupportingList /></Ada>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
