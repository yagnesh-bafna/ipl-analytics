import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { saveTeam, loadTeam, fetchTeamOfTournament, fetchMatrix } from '../lib/api.js'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { Trash2, Save, Cpu, Users } from 'lucide-react'
import clsx from 'clsx'
import { useSquad } from '../context/SquadContext'

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

export default function DreamTeam() {
  const { user } = useAuth()
  const { squad, setSquad } = useSquad()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const { data: matrixData }  = useApi(fetchMatrix)

  const analysis = useMemo(() => {
    if (squad.length < 11) return null;

    // Enrich squad with Matrix data
    const enriched = squad.map(p => {
      const match = matrixData?.find(m => m.player === p.name);
      return { ...p, category: match?.matrix_category || 'Replacement Level' };
    });

    const isOs = (p) => p.country && p.country.toLowerCase() !== 'india';
    const osCount = enriched.filter(isOs).length;
    const bowlCount = enriched.filter(p => p.type === 'bowling' || p.type === 'all_rounder').length;
    const hasWKRole = enriched.some(p => p.roles?.includes('WK'));
    const hasCaptains = enriched.some(p => p.roles?.includes('C')) && enriched.some(p => p.roles?.includes('VC'));

    // Stringent Weights: Reflecting harder progression
    const weights = { 'Superstar': 82, 'Anchor': 70, 'Wildcard': 55, 'Replacement Level': 35 };
    const avgBase = enriched.reduce((sum, p) => sum + (weights[p.category] || 35), 0) / 11;

    let bonus = 0;
    
    // WK Logic: Explicit assignment required for maximum credit
    if (hasWKRole) bonus += 5;
    else bonus -= 15;

    // Bowling Depth: Higher standards for 'Balanced'
    if (bowlCount >= 7) bonus += 8;
    else if (bowlCount === 6) bonus += 3;
    else if (bowlCount === 5) bonus -= 5;
    else bonus -= 20;

    // Overseas Strategic Logic
    if (osCount === 4) bonus += 5;
    else if (osCount < 3) bonus -= 10;
    else if (osCount > 4) bonus -= 30;

    // Leadership Logic
    if (hasCaptains) bonus += 4;
    else if (!enriched.some(p => p.roles?.includes('C'))) bonus -= 10;

    const finalScore = Math.max(0, Math.min(99, Math.round(avgBase + bonus)));

    let archetype = "Unbalanced Squad";
    if (finalScore > 90) archetype = "Championship Contender";
    else if (finalScore > 75) archetype = "Power Balanced";
    else if (bowlCount >= 7) archetype = "Bowling Heavy";
    else if (enriched.filter(p => p.type === 'batting').length >= 6) archetype = "Batting Heavy";
    else if (finalScore > 55) archetype = "Developing System";

    return { score: finalScore, archetype, bowlCount, hasWk: hasWKRole };
  }, [squad, matrixData]);

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
      // Migrate legacy role to roles array if needed
      let currentRoles = Array.isArray(p.roles) ? [...p.roles] : (p.role ? [p.role] : []);
      
      // Clear the legacy role property to avoid UI overlaps
      const { role: _, ...playerWithoutLegacyRole } = p;
      const updatedPlayer = { ...playerWithoutLegacyRole };

      if (i !== idx) {
        // If we are setting C or VC elsewhere, ensure this player doesn't have it
        if (role === 'C' || role === 'VC') {
          updatedPlayer.roles = currentRoles.filter(r => r !== role);
        } else {
          updatedPlayer.roles = currentRoles;
        }
        return updatedPlayer;
      }

      // Logic for the clicked player
      let newRoles = [...currentRoles];
      if (role === 'C') {
        if (newRoles.includes('C')) {
          newRoles = newRoles.filter(r => r !== 'C');
        } else {
          newRoles.push('C');
          newRoles = newRoles.filter(r => r !== 'VC'); // Mutually exclusive with VC
        }
      } else if (role === 'VC') {
        if (newRoles.includes('VC')) {
          newRoles = newRoles.filter(r => r !== 'VC');
        } else {
          newRoles.push('VC');
          newRoles = newRoles.filter(r => r !== 'C'); // Mutually exclusive with C
        }
      } else if (role === 'WK') {
        if (newRoles.includes('WK')) {
          newRoles = newRoles.filter(r => r !== 'WK');
        } else {
          newRoles.push('WK');
        }
      }

      updatedPlayer.roles = newRoles;
      return updatedPlayer;
    });
    setSquad(next);
  };

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
          {/* Squad Analysis Card - Now part of scrollable content */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, height: 0, mb: 0 }}
                animate={{ opacity: 1, height: 'auto', mb: 8 }}
                exit={{ opacity: 0, height: 0, mb: 0 }}
                className="overflow-hidden p-1"
              >
                <div className="glass-card grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-primary-500/5 border-primary-500/20 relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Cpu className="w-24 h-24" />
                  </div>
                  
                  {/* Rating Meter */}
                  <div className="flex flex-col items-center justify-center text-center space-y-4 border-r border-gray-100 dark:border-dark-800 pr-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-dark-800" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * analysis.score) / 100} className="text-primary-500" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-gray-900 dark:text-white leading-none">{analysis.score}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Rating</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Squad Strength</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{analysis.archetype}</p>
                    </div>
                  </div>

                  {/* Composition Breakdown */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-gray-400">Batting Power</span>
                          <span className="text-primary-400">{Math.min(100, analysis.score + 5)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, analysis.score + 5)}%` }} className="h-full bg-primary-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-gray-400">Bowling Depth</span>
                          <span className="text-secondary-400">{Math.min(100, (analysis.bowlCount / 7) * 100).toFixed(2)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (analysis.bowlCount / 7) * 100)}%` }} className="h-full bg-secondary-500" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${analysis.hasWk ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          <div className="w-2 h-2 rounded-full border-2 border-current" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Wicketkeeper</p>
                          <p className={`text-[10px] font-bold ${analysis.hasWk ? 'text-emerald-500' : 'text-red-500'}`}>{analysis.hasWk ? 'Secured' : 'Missing Requirement'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${analysis.bowlCount >= 6 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          <div className="w-2 h-2 rounded-full border-2 border-current" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Bowling Options</p>
                          <p className={`text-[10px] font-bold ${analysis.bowlCount >= 6 ? 'text-emerald-500' : 'text-amber-500'}`}>{analysis.bowlCount} Available</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                              {Array.isArray(p.roles) && p.roles.map(r => (
                                <span key={r} className={clsx(
                                  "px-2 py-0.5 rounded-lg text-[10px] font-black text-white uppercase shadow-sm",
                                  r === 'C' ? "bg-primary-500" : r === 'VC' ? "bg-secondary-500" : "bg-amber-500"
                                )}>
                                  {r}
                                </span>
                              ))}
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
                              className={`w-9 h-9 rounded-xl border-2 text-[11px] font-black transition-all ${p.roles?.includes('C') ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/30' : 'border-gray-200 dark:border-dark-800 text-gray-400 hover:border-primary-500/50'}`}
                              title="Assign Captain"
                            >C</button>
                            <button 
                              onClick={() => setRole(i, 'VC')} 
                              className={`w-9 h-9 rounded-xl border-2 text-[11px] font-black transition-all ${p.roles?.includes('VC') ? 'bg-secondary-500 border-secondary-500 text-white shadow-lg shadow-secondary-500/30' : 'border-gray-200 dark:border-dark-800 text-gray-400 hover:border-secondary-500/50'}`}
                              title="Assign Vice-Captain"
                            >VC</button>
                            <button 
                              onClick={() => setRole(i, 'WK')} 
                              className={`w-9 h-9 rounded-xl border-2 text-[11px] font-black transition-all ${p.roles?.includes('WK') ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30' : 'border-gray-200 dark:border-dark-800 text-gray-400 hover:border-amber-500/50'}`}
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
