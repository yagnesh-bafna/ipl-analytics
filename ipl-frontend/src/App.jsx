import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, lazy, Suspense } from 'react'
import { PageLoader } from './components/ui/Spinner'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SquadProvider } from './context/SquadContext'
import { UIProvider } from './context/UIContext'

// Pages
import Landing from './pages/Landing'
const Auth = lazy(() => import('./pages/Auth'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Scouting = lazy(() => import('./pages/Scouting'))
const Matrix = lazy(() => import('./pages/Matrix'))
const DreamTeam = lazy(() => import('./pages/DreamTeam'))
const Auction = lazy(() => import('./pages/Auction'))
const Contact = lazy(() => import('./pages/Contact'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const PlayerProfile = lazy(() => import('./pages/PlayerProfile'))
const PlayerMatchup = lazy(() => import('./pages/PlayerMatchup'))

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SquadProvider>
          <UIProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* User & Admin shared/protected */}
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/batting"   element={<PrivateRoute><Scouting type="batting" /></PrivateRoute>} />
                  <Route path="/bowling"   element={<PrivateRoute><Scouting type="bowling" /></PrivateRoute>} />
                  <Route path="/all-rounder" element={<PrivateRoute><Scouting type="all_rounder" /></PrivateRoute>} />
                  <Route path="/matrix"    element={<PrivateRoute><Matrix /></PrivateRoute>} />
                  <Route path="/dream-team" element={<PrivateRoute><DreamTeam /></PrivateRoute>} />
                  <Route path="/matchup"    element={<PrivateRoute><PlayerMatchup /></PrivateRoute>} />
                  <Route path="/auction"   element={<PrivateRoute><Auction /></PrivateRoute>} />
                  <Route path="/contact"   element={<PrivateRoute><Contact /></PrivateRoute>} />
                  <Route path="/player/:name" element={<PrivateRoute><PlayerProfile /></PrivateRoute>} />
                  
                  {/* Admin only */}
                  <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </UIProvider>
        </SquadProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
