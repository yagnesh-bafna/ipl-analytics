import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchPlayerProfile } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useSquad } from '../context/SquadContext'
import { PageLoader } from '../components/ui/Spinner'
import { ArrowLeft, CheckCircle, PlusCircle } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Line, ComposedChart, Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border border-gray-100 dark:border-dark-700 p-3 rounded-xl shadow-xl">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs font-medium">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500 dark:text-gray-400">{entry.name}:</span>
            <span className="text-gray-900 dark:text-white">{entry.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function PlayerProfile() {
  const { name } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const type = searchParams.get('type') || 'batting'
  const { user } = useAuth()
  const { squad, addToSquad, removeFromSquad } = useSquad()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedYears, setSelectedYears] = useState([])
  const [graphType, setGraphType] = useState(type === 'bowling' ? 'bowling' : 'batting')

  const isInSquad = useMemo(() => squad.some(p => p.name === name), [squad, name])

  useEffect(() => {
    if (!name) return
    setLoading(true)
    fetchPlayerProfile(name, user?.id).then(({ ok, data }) => {
      if (ok) {
        setData(data)
        const years = Array.from(new Set([
          ...(data.batting || []).map(s => s.season),
          ...(data.bowling || []).map(s => s.season)
        ])).sort((a, b) => a - b)
        setSelectedYears(years)
        
        if (type === 'all_rounder') {
          if (!data.batting?.length && data.bowling?.length) setGraphType('bowling')
          else setGraphType('batting')
        } else {
          setGraphType(type === 'bowling' ? 'bowling' : 'batting')
        }
      }
      setLoading(false)
    })
  }, [name, user?.id, type])

  const toggleYear = (year) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year].sort((a, b) => a - b)
    )
  }

  const filteredStats = useMemo(() => {
    if (!data) return { batting: [], bowling: [], combined: null }
    
    const batting = (data.batting || []).filter(s => selectedYears.includes(s.season))
    const bowling = (data.bowling || []).filter(s => selectedYears.includes(s.season))

    let combined = null
    if (selectedYears.length > 1) {
      if (graphType === 'batting' && batting.length > 0) {
        const matches = batting.reduce((sum, s) => sum + (s.matches || 0), 0)
        const runs = batting.reduce((sum, s) => sum + (s.runs || 0), 0)
        const balls = batting.reduce((sum, s) => sum + (s.balls || 0), 0)
        combined = {
          type: 'batting',
          matches,
          runs,
          balls,
          strike_rate: balls > 0 ? (runs / balls) * 100 : 0
        }
      } else if (graphType === 'bowling' && bowling.length > 0) {
        const matches = bowling.reduce((sum, s) => sum + (s.matches || 0), 0)
        const wickets = bowling.reduce((sum, s) => sum + (s.wickets || 0), 0)
        const dot_balls = bowling.reduce((sum, s) => sum + (s.dot_balls || 0), 0)
        const economy = bowling.reduce((sum, s) => sum + ((s.economy || 0) * (s.matches || 1)), 0) / (matches || 1)
        combined = {
          type: 'bowling',
          matches,
          wickets,
          dot_balls,
          economy
        }
      }
    }

    return { batting, bowling, combined }
  }, [data, selectedYears, graphType])

  const allAvailableYears = useMemo(() => {
    if (!data) return []
    return Array.from(new Set([
      ...(data.batting || []).map(s => s.season),
      ...(data.bowling || []).map(s => s.season)
    ])).sort((a, b) => a - b)
  }, [data])

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 text-gray-400 hover:text-primary-500 hover:border-primary-500/50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{name}</h1>
                {data?.player_info?.[0]?.cricket_country && (
                  <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border-2 ${
                    data.player_info[0].cricket_country.toLowerCase() === 'india' 
                    ? 'text-gray-400 border-gray-100 dark:border-dark-700' 
                    : 'text-secondary-500 border-secondary-500/20 bg-secondary-500/5'
                  }`}>
                    {data.player_info[0].cricket_country.toLowerCase() === 'india' ? 'IND' : `${data.player_info[0].cricket_country.substring(0,3).toUpperCase()} OS`}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                {data?.player_info?.[0]?.age ? `${data.player_info[0].age} Years • ` : ''} 
                {type.replace('_', ' ')} Profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => { 
                if (isInSquad) removeFromSquad(name);
                else addToSquad(name, type, data?.player_info?.[0]?.cricket_country || 'India');
              }}
              className={`flex items-center gap-2 py-3.5 px-8 text-sm font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all rounded-2xl ${
                isInSquad 
                ? 'bg-primary-500 text-white shadow-primary-500/30' 
                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20'
              }`}
            >
              {isInSquad ? (
                <><CheckCircle className="w-5 h-5" /> Added to Squad</>
              ) : (
                <><PlusCircle className="w-5 h-5" /> Add to Squad</>
              )}
            </button>
          </div>
        </div>

        {/* Content Tabs/Selectors */}
        <div className="glass-card mb-8 p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-none bg-gray-50/50 dark:bg-dark-900/50">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">Season Filters:</span>
            {allAvailableYears.map(year => (
              <button
                key={year}
                onClick={() => toggleYear(year)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 border-2 ${
                  selectedYears.includes(year)
                    ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-transparent border-gray-200 dark:border-dark-700 text-gray-400 hover:border-primary-500/50 hover:text-primary-500'
                }`}
              >
                {year}
              </button>
            ))}
            {selectedYears.length < allAvailableYears.length && (
              <button 
                onClick={() => setSelectedYears(allAvailableYears)}
                className="text-xs font-bold text-primary-500 hover:underline px-2"
              >
                Select All
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Tables */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {(type === 'batting' || type === 'all_rounder') && (data?.batting?.length > 0) && (
              <div className="glass-card flex-1 overflow-hidden bg-white/50 dark:bg-dark-900/40 p-6 flex flex-col">
                <h4 className="text-sm font-black uppercase tracking-widest text-primary-500 mb-6 flex items-center gap-3">
                  <div className="w-6 h-1 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />
                  Batting Performance
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-dark-800">
                  <table className="data-table w-full text-sm table-fixed">
                    <thead className="bg-gray-50 dark:bg-dark-950 border-b dark:border-dark-800">
                      <tr>
                        <th className="py-4 px-6 text-left w-1/4">Season</th>
                        <th className="py-4 px-6 text-left w-1/4">Matches</th>
                        <th className="py-4 px-6 text-left w-1/4">Runs</th>
                        <th className="py-4 px-6 text-left w-1/4">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-dark-800">
                      {filteredStats.batting.map((s, i) => (
                        <tr key={i} className="hover:bg-primary-500/5 transition-colors">
                          <td className="py-4 px-6 text-left font-bold tracking-tight">{s.season}</td>
                          <td className="py-4 px-6 text-left font-medium text-gray-500">{s.matches || '—'}</td>
                          <td className="py-4 px-6 text-left font-medium text-gray-900 dark:text-white">{s.runs}</td>
                          <td className="py-4 px-6 text-left font-medium text-gray-400">{(s.strike_rate || 0).toFixed(1)}</td>
                        </tr>
                      ))}
                      {filteredStats.combined?.type === 'batting' && (
                        <tr className="bg-primary-500/10 border-t-2 border-primary-500">
                          <td className="py-4 px-6 text-left font-black text-primary-500 uppercase tracking-tight">Combined</td>
                          <td className="py-4 px-6 text-left font-black text-primary-500">{filteredStats.combined.matches}</td>
                          <td className="py-4 px-6 text-left font-black text-primary-500">{filteredStats.combined.runs}</td>
                          <td className="py-4 px-6 text-left font-black text-primary-500">{filteredStats.combined.strike_rate.toFixed(1)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(type === 'bowling' || type === 'all_rounder') && (data?.bowling?.length > 0) && (
              <div className="glass-card flex-1 overflow-hidden bg-white/50 dark:bg-dark-900/40 p-6 flex flex-col">
                <h4 className="text-sm font-black uppercase tracking-widest text-secondary-500 mb-6 flex items-center gap-3">
                  <div className="w-6 h-1 rounded-full bg-secondary-500 shadow-lg shadow-secondary-500/50" />
                  Bowling Performance
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-dark-800">
                  <table className="data-table w-full text-sm table-fixed">
                    <thead className="bg-gray-50 dark:bg-dark-950 border-b dark:border-dark-800">
                      <tr>
                        <th className="py-4 px-6 text-left w-1/4">Season</th>
                        <th className="py-4 px-6 text-left w-1/4">Matches</th>
                        <th className="py-4 px-6 text-left w-1/4">Wkts</th>
                        <th className="py-4 px-6 text-left w-1/4">Econ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-dark-800">
                      {filteredStats.bowling.map((s, i) => (
                        <tr key={i} className="hover:bg-secondary-500/5 transition-colors">
                          <td className="py-4 px-6 text-left font-bold tracking-tight">{s.season}</td>
                          <td className="py-4 px-6 text-left font-medium text-gray-500">{s.matches || '—'}</td>
                          <td className="py-4 px-6 text-left font-medium text-gray-900 dark:text-white">{s.wickets}</td>
                          <td className="py-4 px-6 text-left font-medium text-gray-400">{(s.economy || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                      {filteredStats.combined?.type === 'bowling' && (
                        <tr className="bg-secondary-500/10 border-t-2 border-secondary-500">
                          <td className="py-4 px-6 text-left font-black text-secondary-500 uppercase tracking-tight">Average</td>
                          <td className="py-4 px-6 text-left font-black text-secondary-500">{filteredStats.combined.matches}</td>
                          <td className="py-4 px-6 text-left font-black text-secondary-500">{filteredStats.combined.wickets}</td>
                          <td className="py-4 px-6 text-left font-black text-secondary-500">{filteredStats.combined.economy.toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-7 space-y-8">
            <div className="glass-card p-8 bg-gray-50/30 dark:bg-dark-900/40 border-none h-full flex flex-col">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Performance Visualization</h4>
                </div>
                {type === 'all_rounder' && (
                  <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-dark-950 rounded-2xl border border-gray-200 dark:border-dark-800">
                    <button 
                      onClick={() => setGraphType('batting')}
                      className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${graphType === 'batting' ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/30' : 'text-gray-400 hover:text-gray-600'}`}
                    >Bat</button>
                    <button 
                      onClick={() => setGraphType('bowling')}
                      className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${graphType === 'bowling' ? 'bg-secondary-500 text-white shadow-xl shadow-secondary-500/30' : 'text-gray-400 hover:text-gray-600'}`}
                    >Bowl</button>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-[400px]">
                {selectedYears.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={graphType === 'batting' ? (data?.batting?.filter(s => selectedYears.includes(s.season))) : (data?.bowling?.filter(s => selectedYears.includes(s.season)))}
                      margin={{ bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.05)" />
                      <XAxis 
                        dataKey="season" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 700 }}
                        dy={20}
                      />
                      <YAxis 
                        yAxisId="left"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '40px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }}
                      />
                      
                      {graphType === 'batting' ? (
                        <>
                          <Bar 
                            yAxisId="left" 
                            dataKey="runs" 
                            name="Runs Scored" 
                            radius={[8, 8, 0, 0]} 
                            barSize={50}
                          >
                            {data?.batting?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={selectedYears.includes(entry.season) ? 1 : 0.15} />
                            ))}
                          </Bar>
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="strike_rate" 
                            name="Strike Rate" 
                            stroke="#10b981" 
                            strokeWidth={4} 
                            dot={{ fill: '#10b981', r: 6, strokeWidth: 3, stroke: '#fff' }}
                            activeDot={{ r: 8, strokeWidth: 0 }}
                          />
                        </>
                      ) : (
                        <>
                          <Bar 
                            yAxisId="left" 
                            dataKey="wickets" 
                            name="Wickets Taken" 
                            radius={[8, 8, 0, 0]} 
                            barSize={50}
                          >
                            {data?.bowling?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill="#ec4899" fillOpacity={selectedYears.includes(entry.season) ? 1 : 0.15} />
                            ))}
                          </Bar>
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="economy" 
                            name="Economy Rate" 
                            stroke="#8b5cf6" 
                            strokeWidth={4} 
                            dot={{ fill: '#8b5cf6', r: 6, strokeWidth: 3, stroke: '#fff' }}
                            activeDot={{ r: 8, strokeWidth: 0 }}
                          />
                        </>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 italic">
                    <p className="font-bold">No Seasons Selected</p>
                    <p className="text-xs uppercase tracking-widest mt-2">Select years to visualize trends</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {((type === 'batting' && !data?.batting?.length) || 
          (type === 'bowling' && !data?.bowling?.length) || 
          (type === 'all_rounder' && !data?.batting?.length && !data?.bowling?.length)) && (
          <div className="flex flex-col items-center justify-center py-32 opacity-30">
            <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-400 animate-spin-slow" />
            <p className="text-2xl font-black text-gray-400 mt-8 uppercase tracking-tighter">No Analytics Found</p>
          </div>
        )}
      </div>
    </div>
  )
}
