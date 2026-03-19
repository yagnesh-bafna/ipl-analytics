import { Sun, Moon, LogOut, Menu } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSquad } from '../../context/SquadContext'
import { useUI } from '../../context/UIContext'

export default function Header({ title, subtitle }) {
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const { toggleSidebar } = useUI()
  const navigate = useNavigate()

  const { squadCount } = useSquad()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const showSquadInfo = ['/batting', '/bowling', '/all-rounder', '/matrix', '/dream-team'].includes(location.pathname)

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-6 mb-8"
    >
      <div className="flex items-center gap-4 w-full lg:w-auto">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2.5 -ml-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="min-w-0">
          <h1 className="text-2xl lg:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium tracking-wide">{subtitle}</p>}
        </div>
      </div>

      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-end gap-4 w-full lg:w-auto">
        <div className="flex items-center gap-3 order-2 lg:order-1">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-11 h-11 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center
                       text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white
                       hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm transition-all duration-300"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Logout */}
          {user && (
            <button
              onClick={handleLogout}
              className="px-5 h-11 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white 
                         shadow-sm transition-all duration-300 flex items-center gap-2 text-sm font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>

        {user && showSquadInfo && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={squadCount}
            className="px-5 py-3 lg:py-4 rounded-xl bg-primary-900/5 dark:bg-accent-amber/10 border border-primary-900/10 dark:border-accent-amber/20 
                       text-primary-900 dark:text-accent-amber text-xs lg:text-sm font-bold font-mono flex items-center justify-center gap-3
                       shadow-sm backdrop-blur-md order-1 lg:order-2 self-stretch lg:self-auto min-w-[120px] lg:min-w-[180px]"
          >
            <div className="w-2 h-2 rounded-full bg-primary-900 dark:bg-accent-amber shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse" />
            SQUAD: {squadCount}/11
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
