import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { fetchMatrix } from '../lib/api'
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
  const { data, loading } = useApi(fetchMatrix)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase()
    return q ? data.filter(p => p.player.toLowerCase().includes(q)) : data
  }, [data, search])

  const dataset = useMemo(() => {
    const groups = {}
    filtered.forEach(p => {
      const cat = p.matrix_category || 'Replacement Level'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push({ x: p.norm_cons, y: p.norm_exp, name: p.player })
    })
    return Object.entries(groups).map(([cat, pts]) => ({
      name: cat, data: pts, fill: CATEGORIES[cat]?.color || '#94a3b8'
    }))
  }, [filtered])

  const counts = useMemo(() => {
    const c = {}
    filtered.forEach(p => { const cat = p.matrix_category || 'Replacement Level'; c[cat] = (c[cat] || 0) + 1 })
    return c
  }, [filtered])

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-hidden">
        <div className="flex-shrink-0">
          <Header title="Player Matrix" subtitle="Strategic categorization and performance clustering." />

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card mb-6 sm:mb-8 p-4 sm:p-6"
          >
            <div className="relative max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" value={search} onChange={e => setSearch(e.target.value)} 
                placeholder="Search player..." 
                className="form-input pl-11 h-11 rounded-xl bg-gray-100/50 dark:bg-dark-800/50 w-full" 
              />
            </div>
          </motion.div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {loading ? <PageLoader /> : (
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
                        <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Runs</th>
                        <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">SR</th>
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
                            <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">{p.runs || 0}</td>
                            <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">{(p.strike_rate || 0).toFixed(1)}</td>
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
