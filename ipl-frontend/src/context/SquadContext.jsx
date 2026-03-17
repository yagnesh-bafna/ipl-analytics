import { createContext, useContext, useState, useEffect } from 'react'
import { loadTeam as apiLoadTeam } from '../lib/api'
import { useAuth } from './AuthContext'

const SquadContext = createContext()

export function SquadProvider({ children }) {
  const { user } = useAuth()
  const [squad, setSquad] = useState([])

  // Load from DB on init
  useEffect(() => {
    if (!user) {
      setSquad([])
      return
    }
    apiLoadTeam(user.id).then(({ ok, data }) => {
      if (ok && data.dream_team && data.dream_team !== '[]') {
        try {
          setSquad(JSON.parse(data.dream_team))
        } catch (e) {
          console.error("Failed to parse squad:", e)
        }
      }
    })
  }, [user])

  const addToSquad = (player, type, country) => {
    if (squad.length >= 11) {
      alert("Squad is full (max 11 players allowed).")
      return false
    }
    if (squad.find(p => p.name === player)) {
      alert("Player is already in your squad.")
      return false
    }

    const isOverseas = (c) => c && c.toLowerCase() !== 'india'
    const overseasCount = squad.filter(p => isOverseas(p.country)).length

    if (isOverseas(country) && overseasCount >= 4) {
      alert("Overseas limit reached (max 4 allowed in 11).")
      return false
    }

    const next = [...squad, { name: player, type, country, role: null }]
    setSquad(next)
    return true
  }

  const removeFromSquad = (name) => {
    setSquad(prev => prev.filter(p => p.name !== name))
  }

  const updateSquad = (newSquad) => {
    setSquad(newSquad)
  }

  return (
    <SquadContext.Provider value={{ 
      squad, 
      setSquad: updateSquad, 
      addToSquad, 
      removeFromSquad,
      squadCount: squad.length 
    }}>
      {children}
    </SquadContext.Provider>
  )
}

export const useSquad = () => useContext(SquadContext)
