import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { fetchMatrix } from '../lib/api.js'
import { useApi } from '../hooks/useApi'
import { Search } from 'lucide-react'

function getRisk(age) {
  if (age < 25)       return { label: 'Young Talent',         color: 'text-emerald-400', badge: 'badge-success' }
  if (age <= 31)      return { label: 'Peak Prime',           color: 'text-secondary-400', badge: 'badge-secondary' }
  if (age <= 35)      return { label: 'Experienced',          color: 'text-amber-400', badge: 'badge-warning' }
  return               { label: 'Veteran',               color: 'text-red-400', badge: 'badge-danger' }
}

function getTraj(age) {
  if (age < 28) return '📈 Improving'
  if (age < 33) return '📊 Stable'
  return '📉 Declining'
}

function getRec(cat = '', age) {
  const c = cat.toLowerCase()
  if (c.includes('superstar')) return { label: age > 35 ? 'Veteran Legend' : 'Must Buy',      badge: 'badge-secondary' }
  if (c.includes('anchor'))    return { label: age > 35 ? 'Experienced Backup' : 'Strategic Buy', badge: 'badge-primary' }
  if (c.includes('wildcard'))  return { label: age < 25 ? 'Rising Star' : 'High Risk/Reward',    badge: 'badge-warning' }
  return { label: 'Budget Fill', badge: 'bg-gray-500/10 text-gray-400' }
}

export default function Auction() {
  const navigate = useNavigate()
  const { data, loading } = useApi(fetchMatrix)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase()
    return q ? data.filter(p => (p.player || '').toLowerCase().includes(q)) : data
  }, [data, search])

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-hidden">
        <div className="flex-shrink-0">
          <Header title="Auction Predictor" subtitle="Age-risk profiling and trajectory recommendations." />

          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card mb-6 sm:mb-8 p-4 sm:p-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" value={search} onChange={e => setSearch(e.target.value)} 
                placeholder="Search player intelligence..." 
                className="form-input pl-11 h-11 rounded-xl bg-gray-100/50 dark:bg-dark-800/50 w-full" 
              />
            </div>
          </motion.div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {loading ? <PageLoader /> : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-dark-900/95 backdrop-blur shadow-sm">
                    <tr>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Player</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Age</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Country</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Risk Profile</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Trajectory</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                    {filtered.map((p, i) => {
                      const age = Math.floor(p.age || 25)
                      const risk = getRisk(age)
                      const traj = getTraj(age)
                      const rec  = getRec(p.matrix_category, age)
                      return (
                        <tr key={i} className="hover:bg-gray-100/30 dark:hover:bg-dark-800/20 transition-colors">
                          <td className="py-4 px-6">
                            <button 
                              onClick={() => navigate(`/player/${p.player}?type=Auction`)} 
                              className="font-bold text-primary-500 hover:text-primary-400 hover:underline text-left text-base"
                            >
                              {p.player}
                            </button>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-gray-700 dark:text-gray-300">{age}</td>
                          <td className="py-4 px-6 text-gray-500 font-semibold">{p.birth_country || 'India'}</td>
                          <td className="py-4 px-6">
                            <span className={`badge ${risk.badge} font-black uppercase text-[10px] tracking-tight`}>{risk.label}</span>
                          </td>
                          <td className="py-4 px-6 font-bold text-sm">{traj}</td>
                          <td className="py-4 px-6">
                            <span className={`badge ${rec.badge} font-black uppercase text-[10px] tracking-tight`}>{rec.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  )
}
