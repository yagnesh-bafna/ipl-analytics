import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// Pages
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Scouting from './pages/Scouting'
import Matrix from './pages/Matrix'
import DreamTeam from './pages/DreamTeam'
import Auction from './pages/Auction'
import Contact from './pages/Contact'
import AdminUsers from './pages/AdminUsers'
import PlayerProfile from './pages/PlayerProfile'

import { SquadProvider } from './context/SquadContext'

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />
  return children
}

import { UIProvider } from './context/UIContext'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SquadProvider>
          <UIProvider>
            <BrowserRouter>
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
                <Route path="/auction"   element={<PrivateRoute><Auction /></PrivateRoute>} />
                <Route path="/contact"   element={<PrivateRoute><Contact /></PrivateRoute>} />
                <Route path="/player/:name" element={<PrivateRoute><PlayerProfile /></PrivateRoute>} />
                
                {/* Admin only */}
                <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </BrowserRouter>
          </UIProvider>
        </SquadProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
