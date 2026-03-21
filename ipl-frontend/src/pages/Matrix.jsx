import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { fetchMatrix } from '../lib/api.js'
import { useApi } from '../hooks/useApi'
import { Search } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSquad } from '../context/SquadContext'

const CATEGORIES = {
  'Superstar':        { color: '#6366f1', badge: 'bg-primary-500/10 text-primary-400' },
  'Anchor':           { color: '#8b5cf6', badge: 'bg-violet-500/10 text-violet-400' },
  'Wildcard':         { color: '#f59e0b', badge: 'bg-amber-500/10 text-amber-400' },
  'Replacement Level':{ color: '#94a3b8', badge: 'bg-slate-500/10 text-slate-400' },
}

const MatrixTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-dark-900/95 backdrop-blur-md border border-dark-700 p-3 rounded-xl shadow-2xl text-xs">
        <p className="font-bold text-white mb-1.5 border-b border-dark-700 pb-1">{data.name}</p>
        <div className="space-y-1">
          <p className="text-gray-400 flex justify-between gap-4">
            <span>Consistency:</span>
            <span className="font-mono text-primary-400">{payload[0].value.toFixed(2)}</span>
          </p>
          <p className="text-gray-400 flex justify-between gap-4">
            <span>Explosiveness:</span>
            <span className="font-mono text-secondary-400">{payload[1].value.toFixed(2)}</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}


export default function Matrix() {
  const navigate = useNavigate()
  const { addToSquad } = useSquad()
  const { data, loading, error } = useApi(fetchMatrix)
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('All')

  const filtered = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    
    // 1. Role Filter
    let base = selectedRole === 'All' 
      ? data 
      : data.filter(p => p.type === selectedRole)

    // 2. Search Filter
    const q = search.toLowerCase()
    return q ? base.filter(p => p.player.toLowerCase().includes(q)) : base
  }, [data, search, selectedRole])

  // Calculate dynamic median lines based on the filtered subset
  const { mx, my } = useMemo(() => {
    if (!filtered.length) return { mx: 50, my: 50 }
    const xSum = filtered.reduce((acc, p) => acc + (Number(p.norm_cons) || 0), 0)
    const ySum = filtered.reduce((acc, p) => acc + (Number(p.norm_exp) || 0), 0)
    return {
      mx: xSum / filtered.length,
      my: ySum / filtered.length
    }
  }, [filtered])

  const dataset = useMemo(() => {
    const groups = {}
    filtered.forEach(p => {
      // Use the dynamic median lines to categorize on the fly for the chart
      const cons = Number(p.norm_cons) || 0
      const exp = Number(p.norm_exp) || 0
      
      let cat = 'Replacement Level'
      if (cons >= mx && exp >= my) cat = 'Superstar'
      else if (cons >= mx) cat = 'Anchor'
      else if (exp >= my) cat = 'Wildcard'

      if (!groups[cat]) groups[cat] = []
      groups[cat].push({ 
        x: cons, 
        y: exp, 
        name: p.player,
        originalCategory: p.matrix_category // Keep for tooltip if needed
      })
    })
    return Object.entries(groups).map(([cat, pts]) => ({
      name: cat, data: pts, fill: CATEGORIES[cat]?.color || '#94a3b8'
    }))
  }, [filtered, mx, my])

  const counts = useMemo(() => {
    const c = { Superstar: 0, Anchor: 0, Wildcard: 0, 'Replacement Level': 0 }
    filtered.forEach(p => {
      const cons = Number(p.norm_cons) || 0
      const exp = Number(p.norm_exp) || 0
      if (cons >= mx && exp >= my) c.Superstar++
      else if (cons >= mx) c.Anchor++
      else if (exp >= my) c.Wildcard++
      else c['Replacement Level']++
    })
    return c
  }, [filtered, mx, my])

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-hidden">
        <div className="flex-shrink-0">
          <Header title="Player Matrix" subtitle="Strategic categorization and performance clustering." />

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search player..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 focus:border-primary-500 outline-none transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex p-1.5 bg-gray-100 dark:bg-dark-900/50 rounded-2xl border border-gray-200 dark:border-dark-700">
              {['All', 'Batter', 'Bowler', 'All-Rounder'].map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    selectedRole === role 
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {loading ? <PageLoader /> : error ? (
            <div className="flex flex-col items-center justify-center h-64 glass-card border-red-500/20">
              <p className="text-red-400 mb-2">Failed to load matrix data</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Scatter chart */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="glass-card mb-8" style={{ height: 450 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      type="number"
                      dataKey="x" name="Consistency" 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                      tickLine={false} axisLine={false} 
                      domain={['auto', 'auto']}
                      tickFormatter={v => v.toFixed(2)}
                      label={{ value: 'CONSISTENCY', fill: '#94a3b8', fontSize: 10, fontWeight: 800, position: 'insideBottom', offset: -10 }} 
                    />
                    <YAxis 
                      type="number"
                      dataKey="y" name="Explosiveness" 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                      tickLine={false} axisLine={false} 
                      domain={['auto', 'auto']}
                      tickFormatter={v => v.toFixed(2)}
                      label={{ value: 'EXPLOSIVENESS', fill: '#94a3b8', fontSize: 10, fontWeight: 800, angle: -90, position: 'insideLeft', offset: 10 }} 
                    />
                    <Tooltip content={<MatrixTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 20 }} />
                    {dataset.map(({ name, data, fill }) => (
                      <Scatter key={name} name={name} data={data} fill={fill} fillOpacity={0.6}
                        onClick={d => navigate(`/player/${d.name}?type=Matrix`)} style={{ cursor: 'pointer' }} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Table */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="glass-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
                    <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-dark-900/95 backdrop-blur shadow-sm">
                      <tr>
                        <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Player</th>
                        <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Category</th>
                        
                        {/* Dynamic Headers based on selectedRole */}
                        {selectedRole === 'Batter' && (
                          <>
                            <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Runs</th>
                            <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">SR</th>
                          </>
                        )}
                        {selectedRole === 'Bowler' && (
                          <>
                            <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Wickets</th>
                            <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Econ</th>
                          </>
                        )}
                        {(selectedRole === 'All-Rounder' || selectedRole === 'All') && (
                          <>
                            <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Runs</th>
                            <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Wickets</th>
                          </>
                        )}
                        
                        <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                      {filtered.slice(0, 50).map((p, i) => {
                        const cat = p.matrix_category || 'Replacement Level'
                        const { badge } = CATEGORIES[cat] || {}
                        return (
                          <tr key={i} className="hover:bg-gray-100/50 dark:hover:bg-dark-800/30 transition-colors">
                            <td className="py-4 px-6"><button onClick={() => navigate(`/player/${p.player}?type=Matrix`)} className="font-bold text-primary-500 hover:text-primary-400 hover:underline">{p.player}</button></td>
                            <td className="py-4 px-6"><span className={`badge ${badge} text-xs font-bold`}>{cat}</span></td>
                            
                            {/* Dynamic Cells based on selectedRole */}
                            {selectedRole === 'Batter' && (
                              <>
                                <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">{p.runs || 0}</td>
                                <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">{(p.strike_rate || 0).toFixed(1)}</td>
                              </>
                            )}
                            {selectedRole === 'Bowler' && (
                              <>
                                <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">{p.wickets || 0}</td>
                                <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">{(p.economy || 0).toFixed(2)}</td>
                              </>
                            )}
                            {(selectedRole === 'All-Rounder' || selectedRole === 'All') && (
                              <>
                                <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">{p.runs || 0}</td>
                                <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">{p.wickets || 0}</td>
                              </>
                            )}

                            <td className="py-4 px-6 capitalize text-gray-500 font-semibold">{p.type}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
