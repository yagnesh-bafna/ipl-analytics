import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Slider, Button } from 'antd'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { fetchBatting, fetchBowling, fetchAllRounder } from '../lib/api.js'
import { useApi } from '../hooks/useApi'
import { Search, PlusCircle, CheckCircle, ChevronUp, ChevronDown, Filter, X } from 'lucide-react'
import { useSquad } from '../context/SquadContext'

const CONFIG = {
  batting: {
    title: 'Batting Scouting',
    subtitle: 'High-fidelity batting performance metrics.',
    apiFn: fetchBatting,
    columns: [
      { key: 'player',      label: 'Player' },
      { key: 'matches',     label: 'Matches' },
      { key: 'runs',        label: 'Runs',    sortable: true },
      { key: 'strike_rate', label: 'SR',      fmt: v => v?.toFixed(1), sortable: true },
      { key: 'avg',         label: 'Avg',     fmt: v => v?.toFixed(1), sortable: true },
      { key: 'boundary_pct',label: 'Bnd%',   fmt: v => `${v?.toFixed(1)}%` },
    ],
    nameKey: 'player',
    filterFields: [
      { key: 'runs', label: 'Min Runs', min: 0, max: 1000, step: 10 },
      { key: 'strike_rate', label: 'Min SR', min: 0, max: 250, step: 5 },
      { key: 'avg', label: 'Min Avg', min: 0, max: 100, step: 1 },
    ]
  },
  bowling: {
    title: 'Bowling Scouting',
    subtitle: 'High-fidelity bowling performance metrics.',
    apiFn: fetchBowling,
    columns: [
      { key: 'player',      label: 'Player' },
      { key: 'matches',     label: 'Matches' },
      { key: 'wickets',     label: 'Wkts',  sortable: true },
      { key: 'economy',     label: 'Econ',  fmt: v => v?.toFixed(2), sortable: true },
      { key: 'avg',         label: 'Avg',   fmt: v => v?.toFixed(2), sortable: true },
      { key: 'strike_rate', label: 'SR',  fmt: v => v?.toFixed(1) },
      { key: 'dot_ball_pct',label: 'Dot%', fmt: v => `${v?.toFixed(1)}%` },
    ],
    nameKey: 'player',
    filterFields: [
      { key: 'wickets', label: 'Min Wickets', min: 0, max: 35, step: 1 },
      { key: 'economy', label: 'Max Economy', min: 0, max: 15, step: 0.5, isMax: true },
      { key: 'avg', label: 'Max Avg', min: 0, max: 60, step: 1, isMax: true },
      { key: 'strike_rate', label: 'Min SR', min: 0, max: 50, step: 1 },
    ]
  },
  all_rounder: {
    title: 'All-Rounder Scouting',
    subtitle: 'Combined batting and bowling performance metrics.',
    apiFn: fetchAllRounder,
    columns: [
      { key: 'player',  label: 'Player' },
      { key: 'matches', label: 'Matches' },
      { key: 'runs',    label: 'Runs',  sortable: true },
      { key: 'wickets', label: 'Wkts',  sortable: true },
      { key: 'avg',     label: 'Bat Avg',   fmt: v => v?.toFixed(1) },
      { key: 'economy', label: 'Econ',  fmt: v => v?.toFixed(2) },
    ],
    nameKey: 'player',
    filterFields: [
      { key: 'runs', label: 'Min Runs', min: 0, max: 1000, step: 10 },
      { key: 'wickets', label: 'Min Wickets', min: 0, max: 35, step: 1 },
      { key: 'strike_rate', label: 'Min Bat SR', min: 0, max: 250, step: 5 },
      { key: 'economy', label: 'Max Economy', min: 0, max: 15, step: 0.5, isMax: true },
    ]
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
  const [showFilters, setShowFilters] = useState(false)
  
  // Initialize filters based on config
  const [filters, setFilters] = useState(() => {
    const initial = {}
    const currentCfg = CONFIG[type] || CONFIG.batting
    currentCfg.filterFields.forEach(f => {
      initial[f.key] = f.isMax ? f.max : f.min
    })
    return initial
  })

  useEffect(() => {
    const initialFilters = {}
    cfg.filterFields.forEach(f => {
      initialFilters[f.key] = f.isMax ? f.max : f.min
    })
    setFilters(initialFilters)
    setSearch('')
    setSortKey(null)
    setSortDir('desc')
    setShowFilters(false)
  }, [type, cfg])

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }))
  }

  const resetFilters = () => {
    const initialFilters = {}
    cfg.filterFields.forEach(f => {
      initialFilters[f.key] = f.isMax ? f.max : f.min
    })
    setFilters(initialFilters)
    setSearch('')
  }

  const isInSquad = (name) => squad.some(p => p.name === name)

  const filtered = useMemo(() => {
    if (!data) return []
    let rows = data.filter(r => {
      const name = (r[cfg.nameKey] || '').toLowerCase()
      const matchesSearch = name.includes(search.toLowerCase())
      
      const matchesFilters = cfg.filterFields.every(f => {
        const val = r[f.key] ?? 0
        const filterVal = filters[f.key]
        if (f.isMax) return val <= filterVal
        return val >= filterVal
      })

      return matchesSearch && matchesFilters
    })
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
        return sortDir === 'desc' ? bv - av : av - bv
      })
    }
    return rows
  }, [data, search, sortKey, sortDir, cfg.nameKey, filters, cfg.filterFields])

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
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="form-input pl-12 h-12 rounded-xl bg-gray-100/50 dark:bg-dark-800/50 w-full"
                />
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  icon={showFilters ? <X size={18} /> : <Filter size={18} />}
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-12 px-6 rounded-xl border-none font-bold transition-all ${
                    showFilters 
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                    : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20'
                  }`}
                >
                  {showFilters ? 'Close Filters' : 'Advanced Filters'}
                </Button>
                {Object.values(filters).some((v, i) => {
                  const f = cfg.filterFields[i]
                  return f && (f.isMax ? v < f.max : v > f.min)
                }) && (
                  <Button 
                    onClick={resetFilters}
                    className="h-12 px-6 rounded-xl border-none bg-gray-100 dark:bg-dark-800 text-gray-500 font-bold hover:bg-gray-200"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8 mt-8 border-t border-gray-100 dark:border-dark-800">
                    {cfg.filterFields.map(f => (
                      <div key={f.key} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                            {f.label}
                          </label>
                          <span className="text-sm font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded">
                            {filters[f.key]?.toFixed(f.step < 1 ? 1 : 0)}
                          </span>
                        </div>
                        <Slider
                          min={f.min}
                          max={f.max}
                          step={f.step}
                          value={filters[f.key]}
                          onChange={val => handleFilterChange(f.key, val)}
                          className="custom-slider"
                          trackStyle={{ backgroundColor: 'var(--color-primary-500)' }}
                          handleStyle={{ borderColor: 'var(--color-primary-500)', backgroundColor: '#fff' }}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
