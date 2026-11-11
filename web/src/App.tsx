import { AnimatePresence, motion } from 'motion/react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import { CirclesList, ContributionsList, GoalsList, SupportingList } from './screens/Lists'

export function App() {
  const location = useLocation()

  return (
    // Phone-width column: full screen on mobile, centred "device" on desktop
    <div className="fixed inset-y-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 overflow-hidden bg-white shadow-[0_0_40px_rgba(0,0,0,0.12)]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
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
            <Route path="/adawise" element={<Adawise />} />
            <Route path="/adawise/new-goal" element={<NewGoal />} />
            <Route path="/adawise/goal/:id" element={<GoalDetail />} />
            <Route path="/adawise/new-circle" element={<NewCircle />} />
            <Route path="/adawise/circle/:id" element={<CircleDetail />} />
            <Route path="/adawise/requests" element={<RequestsList />} />
            <Route path="/adawise/requests/:id" element={<RequestDetail />} />
            <Route path="/adawise/notifications" element={<Notifications />} />
            <Route path="/adawise/goals" element={<GoalsList />} />
            <Route path="/adawise/circles" element={<CirclesList />} />
            <Route path="/adawise/contributions" element={<ContributionsList />} />
            <Route path="/adawise/supporting" element={<SupportingList />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
