import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { saveTeam, loadTeam, fetchTeamOfTournament } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Trash2, Save, Cpu, Users } from 'lucide-react'
import clsx from 'clsx'

const formatCountry = (c) => {
  if (!c) return 'Ind'
  if (c.toLowerCase() === 'india') return 'Ind'
  const code = c.substring(0, 3).toUpperCase()
  return `${code} Os`
}

const TYPE_BADGE = {
  batting:    'badge-primary',
  bowling:    'badge-success',
  all_rounder:'badge-secondary',
  'Algorithmic Optimization': 'badge-warning',
}

import { useSquad } from '../context/SquadContext'

export default function DreamTeam() {
  const { user } = useAuth()
  const { squad, setSquad } = useSquad()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  const remove = idx => {
    const next = squad.filter((_, i) => i !== idx)
    setSquad(next)
  }

  const save = async () => {
    if (!user) return
    setSaving(true)
    const { ok } = await saveTeam(user.id, squad)
    setSaving(false)
    setMsg(ok ? 'Squad saved successfully.' : 'Save failed. Try again.')
    setTimeout(() => setMsg(''), 3000)
  }

  const setRole = (idx, role) => {
    const next = squad.map((p, i) => {
      if (i !== idx) {
        // Clear if it's C or VC and we are setting it elsewhere
        if ((role === 'C' || role === 'VC') && p.role === role) {
          return { ...p, role: null }
        }
        return p
      }
      // Toggle role
      return { ...p, role: p.role === role ? null : role }
    })
    setSquad(next)
  }

  const autoGenerate = async () => {
    setLoading(true)
    const { ok, data } = await fetchTeamOfTournament()
    if (ok && data) {
      // In a real scenario, the backend might return more than 11 or unsorted
      // Here we assume it returns a good pool, but we must enforce the 4 OS limit
      const allPlayers = data.map(p => ({
        name: p.player,
        type: 'Algorithmic Optimization',
        country: p.cricket_country || 'India'
      }))

      const isOs = (p) => p.country && p.country.toLowerCase() !== 'india'
      
      const indians = allPlayers.filter(p => !isOs(p))
      const overseas = allPlayers.filter(p => isOs(p))

      // Take up to 4 overseas, and fill rest with Indians to make 11
      const selectedOs = overseas.slice(0, 4)
      const selectedInd = indians.slice(0, 11 - selectedOs.length)
      
      const finalTeam = [...selectedOs, ...selectedInd].slice(0, 11)
      
      setSquad(finalTeam)
      setMsg('AI Squad generated (respecting 4 overseas limit).')
      setTimeout(() => setMsg(''), 3000)
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-hidden">
        <div className="flex-shrink-0">
          <Header title="Dream Team" subtitle="Draft registry and squad optimization center." />

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card mb-6 sm:mb-8 p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                <div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Final Squad</div>
                  <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{squad.length}/11 Players</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Overseas</div>
                  <div className={clsx("text-lg sm:text-xl font-black", (squad.filter(p => p.country && p.country.toLowerCase() !== 'india').length > 4) ? "text-red-500" : "text-gray-900 dark:text-white")}>
                    {squad.filter(p => p.country && p.country.toLowerCase() !== 'india').length}/4 Slots
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={saving || loading || squad.length === 0}
                  className="w-full sm:w-auto btn-primary py-2.5 sm:py-3 px-6 sm:px-8 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Syncing...' : 'Sync Registry'}
                </button>
              </div>
            </div>
            {msg && <p className={`mt-4 text-sm font-bold ${msg.includes('success') ? 'text-emerald-500' : 'text-red-500'}`}>{msg}</p>}
          </motion.div>
        </div>

        {/* Team list (Scrollable) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 overflow-y-auto min-h-0 glass-card p-0 overflow-x-auto custom-scrollbar">
          {squad.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center shadow-inner">
                <Users className="w-10 h-10 text-gray-300 dark:text-dark-600" />
              </div>
              <div className="max-w-xs">
                <p className="text-gray-900 dark:text-white font-bold text-lg mb-1">Squad is Empty</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Identify world-class talent in Scouting views to build your championship roster.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto min-w-full">
              <table className="data-table w-full">
                <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-dark-900/95 backdrop-blur shadow-sm">
                  <tr>
                    <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500 w-16">#</th>
                    <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Player</th>
                    <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Original Unit</th>
                    <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Appointments</th>
                    <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500 w-16">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                  <AnimatePresence>
                    {squad.map((p, i) => (
                      <motion.tr key={p.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-gray-100/30 dark:hover:bg-dark-800/20 transition-colors"
                      >
                        <td className="py-4 px-6 text-gray-400 font-mono font-bold text-xs">{String(i + 1).padStart(2, '0')}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white text-base">{p.name}</span>
                              {p.role && (
                                <span className="px-2 py-0.5 rounded-lg bg-primary-500 text-[10px] font-black text-white uppercase shadow-sm">
                                  {p.role}
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] uppercase font-black tracking-widest ${p.country?.toLowerCase() !== 'india' ? 'text-secondary-500' : 'text-gray-400'}`}>
                              {formatCountry(p.country)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6"><span className={`badge ${TYPE_BADGE[p.type] || 'badge-primary'} font-bold uppercase text-[10px]`}>{p.type?.replace('_', ' ')}</span></td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setRole(i, 'C')} 
                              className={`w-9 h-9 rounded-xl border-2 text-[11px] font-black transition-all ${p.role === 'C' ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/30' : 'border-gray-200 dark:border-dark-800 text-gray-400 hover:border-primary-500/50'}`}
                              title="Assign Captain"
                            >C</button>
                            <button 
                              onClick={() => setRole(i, 'VC')} 
                              className={`w-9 h-9 rounded-xl border-2 text-[11px] font-black transition-all ${p.role === 'VC' ? 'bg-secondary-500 border-secondary-500 text-white shadow-lg shadow-secondary-500/30' : 'border-gray-200 dark:border-dark-800 text-gray-400 hover:border-secondary-500/50'}`}
                              title="Assign Vice-Captain"
                            >VC</button>
                            <button 
                              onClick={() => setRole(i, 'WK')} 
                              className={`w-9 h-9 rounded-xl border-2 text-[11px] font-black transition-all ${p.role === 'WK' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30' : 'border-gray-200 dark:border-dark-800 text-gray-400 hover:border-amber-500/50'}`}
                              title="Assign Wicketkeeper"
                            >WK</button>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <button onClick={() => remove(i)} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
