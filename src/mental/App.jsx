import { MemoryRouter, Routes, Route } from 'react-router-dom'
import NavBar        from './components/NavBar'
import Home          from './screens/Home'
import BinauralBeats from './screens/BinauralBeats'
import Affirmations  from './screens/Affirmations'
import EMDR          from './screens/EMDR'
import Visualization from './screens/Visualization'
import Goals         from './screens/Goals'
import Journal       from './screens/Journal'
import Routine       from './screens/Routine'
import Settings      from './screens/Settings'

export default function MentalApp() {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/"              element={<Home />}          />
        <Route path="/binaural"      element={<BinauralBeats />} />
        <Route path="/affirmations"  element={<Affirmations />}  />
        <Route path="/emdr"          element={<EMDR />}          />
        <Route path="/visualization" element={<Visualization />} />
        <Route path="/goals"         element={<Goals />}         />
        <Route path="/journal"       element={<Journal />}       />
        <Route path="/routine"       element={<Routine />}       />
        <Route path="/settings"      element={<Settings />}      />
      </Routes>
      <NavBar />
    </MemoryRouter>
  )
}
