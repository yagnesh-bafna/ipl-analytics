import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { fetchUserStats, fetchTrending, fetchAdminStats, fetchAdminLogs } from '../lib/api.js'
import {
  Layers, Zap, Target, Wind, Grid3x3, Users, TrendingUp, BarChart3, ScrollText
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import LottieAnimation from '../components/ui/LottieAnimation'
import { useSquad } from '../context/SquadContext'

const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  show:    { opacity: 1, y:  0, transition: { duration: 0.35 } },
}
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

const quickLinks = [
  { label: 'Batting Scouting',  icon: Target,    path: '/batting',    color: 'text-primary-500', bg: 'bg-primary-500/10' },
  { label: 'Bowling Scouting',  icon: Wind,      path: '/bowling',    color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'Player Matrix',     icon: Grid3x3,   path: '/matrix',     color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
  { label: 'Draft Registry',    icon: Users,     path: '/dream-team', color: 'text-secondary-500', bg: 'bg-secondary-500/10' },
]

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <motion.div variants={cardVariants} className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white font-heading">{value ?? '—'}</div>
      </div>
    </motion.div>
  )
}


const DOTS_ANIM = "https://assets9.lottiefiles.com/packages/lf20_o6py8vdb.json" // Abstract dots
const CHART_ANIM = "https://assets10.lottiefiles.com/packages/lf20_6wutsrox.json" // Abstract data/nodes


// User dashboard
function UserDashboard() {
  const { user } = useAuth()
  const { squad } = useSquad()
  const navigate = useNavigate()
  const [stats, setStats]       = useState(null)
  const [trending, setTrending] = useState([])

  useEffect(() => {
    fetchUserStats(user.id).then(({ ok, data }) => { if (ok) setStats(data) })
    fetchTrending().then(({ ok, data }) => { if (ok) setTrending(data.slice(0, 3)) })
  }, [user.id])

  const rankLabel = ['Top Target', 'Strong Interest', 'Rising Popularity']

  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* Decision Intelligence Hub (Dynamic Replacement for 'Platform Intel Loaded') */}
      <motion.div variants={cardVariants} className="glass-card mb-6 overflow-hidden relative group border-l-4 border-l-primary-500">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest text-primary-500">Strategic Intelligence Active</span>
            </div>
            
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
              {squad.length === 0 
                ? "Begin Your Championship Draft" 
                : squad.length < 11 
                  ? `Squad Assembly: ${Math.round((squad.length / 11) * 100)}% Complete` 
                  : "Squad Registry Finalized"}
            </h2>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span className="font-bold text-gray-700 dark:text-gray-200">
                  {squad.filter(p => p.country?.toLowerCase() !== 'india').length}/4
                </span> 
                Overseas Slots Used
              </div>
              {trending[0] && (
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 border-l border-gray-200 dark:border-dark-700 pl-6">
                  <TrendingUp className="w-3.5 h-3.5 text-secondary-500" />
                  <span className="font-medium">Market Insight:</span> 
                  <span className="text-secondary-500 font-bold">{trending[0].player}</span> is trending
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end text-right">
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter mb-1">Compute Latency</div>
              <div className="text-xs font-mono font-bold text-emerald-500">12ms (Optimal)</div>
            </div>
            <div className="w-24 h-24 opacity-60 group-hover:opacity-100 transition-opacity">
               <LottieAnimation url={DOTS_ANIM} className="w-full h-full" />
            </div>
          </div>
        </div>
        
        {/* Subtle Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-500/5 to-transparent pointer-events-none" />
      </motion.div>

      {/* Stats */}
      <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <StatCard icon={Layers} label="Saved Squads"      value={stats?.saved_squads}      color="text-primary-500"   bg="bg-primary-500/10" />
        <StatCard icon={Zap}    label="Analytics Explored" value={stats?.analytics_explored} color="text-secondary-500" bg="bg-secondary-500/10" />
      </motion.div>

      {/* Quick links */}
      <motion.div variants={cardVariants}>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Selection</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {quickLinks.map(({ label, icon: Icon, path, color, bg }) => (
            <button key={path} onClick={() => navigate(path)}
              className="glass-card flex flex-col items-center text-center gap-3 py-8 hover:border-primary-500/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Trending */}
      {trending.length > 0 && (
        <motion.div variants={cardVariants}>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Global Trending Players</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {trending.map((p, i) => {
              const initials = p.player.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              return (
                <div key={p.player} className="glass-card flex items-center gap-4 hover:border-secondary-500/30 transition-all duration-200">
                  <div className="w-12 h-12 rounded-full bg-secondary-500/10 flex items-center justify-center text-secondary-500 font-bold text-sm flex-shrink-0 border border-secondary-500/20">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{p.player}</div>
                    <div className="text-xs text-gray-400 mb-1">Scouted {p.views} times</div>
                    <span className="badge badge-secondary">{rankLabel[i]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Admin dashboard
function AdminDashboard() {
  const [stats, setStats]     = useState(null)
  const [trending, setTrending] = useState([])
  const [logs, setLogs]         = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchAdminStats().then(({ ok, data }) => { if (ok) setStats(data) })
    fetchTrending().then(({ ok, data }) => { if (ok) setTrending(data.slice(0, 8)) })
    fetchAdminLogs().then(({ ok, data }) => { if (ok) setLogs(data.slice(0, 5)) })
  }, [])

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Stat cards */}
      <motion.div variants={container} className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard icon={Users}    label="Platform Users"    value={stats?.total_users}    color="text-primary-500"   bg="bg-primary-500/10"   />
        <StatCard icon={Users}    label="Unique Players"    value={stats?.unique_players}  color="text-secondary-500" bg="bg-secondary-500/10" />
        <StatCard icon={BarChart3} label="Total Records"    value={stats?.total_records}   color="text-emerald-500"   bg="bg-emerald-500/10"   />
        <StatCard icon={ScrollText} label="Active Inquiries" value={stats?.total_messages} color="text-amber-500"     bg="bg-amber-500/10"     />
      </motion.div>

      {/* Trending chart + tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart */}
        <motion.div variants={cardVariants} className="glass-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" /> Trending Players
          </h3>
          {trending.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trending} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="player" 
                  tick={{ fill: '#94a3b8', fontSize: 9 }} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, color: '#f8fafc', fontSize: 12 }} />
                <Bar dataKey="views" fill="#6366f1" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No trending data yet.</div>}
        </motion.div>

        {/* Tools */}
        <motion.div variants={cardVariants} className="glass-card flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-5">Administrative Tools</h3>
          <div className="space-y-3 flex-1">
            <button onClick={() => navigate('/admin/users')} className="btn-ghost w-full text-left flex items-center gap-3 text-sm">
              <Users className="w-4 h-4 text-primary-500" /> User Management Registry
            </button>
            <button onClick={() => navigate('/contact')} className="btn-ghost w-full text-left flex items-center gap-3 text-sm">
              <ScrollText className="w-4 h-4 text-secondary-500" /> System Inquiry Logs
            </button>
          </div>
        </motion.div>
      </div>

      {/* Recent logs */}
      {logs.length > 0 && (
        <motion.div variants={cardVariants} className="glass-card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-amber-500" /> Recent Inquiries
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Date</th></tr></thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i}>
                    <td className="font-medium">{l.name}</td>
                    <td className="text-gray-400 dark:text-gray-500">{l.email}</td>
                    <td className="max-w-xs truncate text-gray-500">{l.message}</td>
                    <td className="text-gray-400">{l.created_at?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) { navigate('/auth'); return null }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-hidden">
        <div className="flex-shrink-0">
          <Header
            title={`${greeting}, ${user.username}`}
            subtitle={user.role === 'admin' ? 'Platform control center and aggregate data intelligence.' : 'Your personalized IPL insights and squad analytics.'}
          />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
        </div>
      </div>
    </Layout>
  )
}
