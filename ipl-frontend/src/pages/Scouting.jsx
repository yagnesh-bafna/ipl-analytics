import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { fetchBatting, fetchBowling, fetchAllRounder } from '../lib/api.js'
import { useApi } from '../hooks/useApi'
import { Search, PlusCircle, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { useSquad } from '../context/SquadContext'

const CONFIG = {
  batting: {
    title: 'Batting Scouting',
    subtitle: 'High-fidelity batting performance metrics.',
    apiFn: fetchBatting,
    columns: [
      { key: 'player',      label: 'Player', fmt: v => <span className="font-serif font-bold text-slate-900 dark:text-slate-100">{v}</span> },
      { key: 'matches',     label: 'Matches' },
      { key: 'runs',        label: 'Runs',    sortable: true },
      { key: 'strike_rate', label: 'SR',      fmt: v => v?.toFixed(1), sortable: true },
      { key: 'avg',         label: 'Avg',     fmt: v => v?.toFixed(1), sortable: true },
      { key: 'boundary_pct',label: 'B%',     fmt: v => `${v?.toFixed(1)}%` },
    ],
    nameKey: 'player',
  },
  bowling: {
    title: 'Bowling Scouting',
    subtitle: 'High-fidelity bowling performance metrics.',
    apiFn: fetchBowling,
    columns: [
      { key: 'player',      label: 'Player', fmt: v => <span className="font-serif font-bold text-slate-900 dark:text-slate-100">{v}</span> },
      { key: 'matches',     label: 'Matches' },
      { key: 'wickets',     label: 'Wkts',  sortable: true },
      { key: 'economy',     label: 'Econ',  fmt: v => v?.toFixed(2), sortable: true },
      { key: 'strike_rate', label: 'SR',  fmt: v => v?.toFixed(1) },
      { key: 'dot_ball_pct',label: 'Dot%', fmt: v => `${v?.toFixed(1)}%` },
    ],
    nameKey: 'player',
  },
  all_rounder: {
    title: 'All-Rounder Scouting',
    subtitle: 'Combined batting and bowling performance metrics.',
    apiFn: fetchAllRounder,
    columns: [
      { key: 'player',      label: 'Player', fmt: v => <span className="font-serif font-bold text-slate-900 dark:text-slate-100">{v}</span> },
      { key: 'matches',     label: 'Matches' },
      { key: 'runs',        label: 'Runs', sortable: true },
      { key: 'wickets',     label: 'Wkts', sortable: true },
      { key: 'strike_rate', label: 'SR', fmt: v => v?.toFixed(1) },
      { key: 'economy',     label: 'Econ', fmt: v => v?.toFixed(2) },
    ],
    nameKey: 'player',
  },
}

const formatCountry = (c) => {
  if (!c) return 'Ind'
  if (c.toLowerCase() === 'india') return 'Ind'
  const code = c.substring(0, 3).toUpperCase()
  return `${code} Os`
}


export default function Scouting({ type }) {
  const navigate = useNavigate()
  const { squad, addToSquad, removeFromSquad } = useSquad()
  const cfg = CONFIG[type] || CONFIG.batting
  const { data, loading, error } = useApi(cfg.apiFn, [type])

  const [search,   setSearch]   = useState('')
  const [sortKey,  setSortKey]  = useState(null)
  const [sortDir,  setSortDir]  = useState('desc')

  const isInSquad = (name) => squad.some(p => p.name === name)

  const filtered = useMemo(() => {
    if (!data) return []
    let rows = data.filter(r => {
      const name = (r[cfg.nameKey] || '').toLowerCase()
      return name.includes(search.toLowerCase())
    })
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
        return sortDir === 'desc' ? bv - av : av - bv
      })
    }
    return rows
  }, [data, search, sortKey, sortDir, cfg.nameKey])

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-hidden">
        {/* Fixed Header & Search */}
        <div className="flex-shrink-0">
          <Header title={cfg.title} subtitle={cfg.subtitle} />

          {/* Filters (Non-Sticky, grouped at top) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="glass-card mb-8 p-6"
          >
            <div className="relative max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="form-input pl-12 h-12 rounded-xl bg-gray-100/50 dark:bg-dark-800/50"
              />
            </div>
          </motion.div>
        </div>

        {/* Scrollable Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1 overflow-y-auto min-h-0 glass-card p-0 overflow-x-auto custom-scrollbar"
        >
          {loading ? <PageLoader /> : error ? (
            <div className="p-12 text-center text-red-400 font-medium">{error}</div>
          ) : (
            <div className="min-w-full">
              <table className="data-table w-full">
                <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-dark-900/95 backdrop-blur shadow-sm">
                  <tr>
                    {cfg.columns.map(col => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && toggleSort(col.key)}
                        className={col.sortable ? 'cursor-pointer hover:text-gray-900 dark:hover:text-white select-none py-4 px-6 text-left' : 'py-4 px-6 text-left'}
                      >
                        <span className="flex items-center gap-1.5 uppercase text-[11px] font-bold tracking-wider text-gray-500">
                          {col.label}
                          {col.sortable && sortKey === col.key && (
                            sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={cfg.columns.length + 1} className="text-center text-gray-400 py-12">No records match.</td></tr>
                  ) : filtered.map((row, i) => {
                    const name = row[cfg.nameKey]
                    const country = row.cricket_country || 'India'
                    const countryTag = formatCountry(country)
                    const isOs = country.toLowerCase() !== 'india'

                    return (
                      <tr key={i} className="hover:bg-gray-100/50 dark:hover:bg-dark-800/30 transition-colors">
                        {cfg.columns.map(col => (
                          <td key={col.key} className="py-4 px-6">
                            {col.key === cfg.nameKey ? (
                              <div className="flex flex-col">
                                <button
                                  onClick={() => navigate(`/player/${name}?type=${type}`)}
                                  className="font-bold text-primary-500 hover:text-primary-400 hover:underline text-left text-base"
                                >{name}</button>
                                <span className={`text-[10px] uppercase font-black tracking-widest ${isOs ? 'text-secondary-500' : 'text-gray-400'}`}>
                                  {countryTag}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {col.fmt ? col.fmt(row[col.key]) : (row[col.key] ?? '—')}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="py-4 px-6">
                          {isInSquad(name) ? (
                            <button
                              onClick={() => removeFromSquad(name)}
                              className="flex items-center gap-2 text-sm font-bold text-primary-500 transition-all group"
                            >
                              <CheckCircle className="w-5 h-5" /> Added
                            </button>
                          ) : (
                            <button
                              onClick={() => addToSquad(name, type, country)}
                              className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary-500 transition-all group"
                            >
                              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Add
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
