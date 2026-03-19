import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, User, Target, Wind, Layers, Award,
  Banknote, Mail, BarChart3, Users, GitCompare
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const navItems = [
  { path: '/dashboard',   label: 'Dashboard',         icon: LayoutDashboard },
  { path: '/batting',     label: 'Batting Scouting',  icon: User },
  { path: '/all-rounder', label: 'All-Rounder',       icon: BarChart3 },
  { path: '/bowling',     label: 'Bowling Scouting',  icon: Target },
  { path: '/matchup',     label: 'Player Matchup',    icon: GitCompare },
  { path: '/matrix',      label: 'Player Matrix',     icon: Layers },
  { path: '/dream-team',  label: 'Dream Team',        icon: Award },
  { path: '/auction',     label: 'Auction Predictor', icon: Banknote },
  { path: '/contact',     label: 'Contact Us',        icon: Mail },
]

const adminItems = [
  { path: '/dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/admin/users',  label: 'Registry Management', icon: Users },
  { path: '/contact',      label: 'Contact',          icon: Mail },
]

import { useUI } from '../../context/UIContext'
import { X } from 'lucide-react'

export default function Sidebar() {
  const { user } = useAuth()
  const { isSidebarOpen, closeSidebar } = useUI()
  const items = user?.role === 'admin' ? adminItems : navItems

  return (
    <motion.aside
      initial={false}
      animate={{ 
        x: isSidebarOpen ? 0 : (window.innerWidth < 1024 ? -280 : 0) 
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={clsx(
        "fixed top-0 left-0 h-full w-64 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-8 border-b border-slate-100/50 dark:border-slate-800/50">
        <Link 
          to="/dashboard"
          onClick={closeSidebar}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 bg-primary-900 dark:bg-accent-amber rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 dark:shadow-accent-amber/10">
            <BarChart3 className="w-5 h-5 text-white dark:text-primary-900" />
          </div>
          <div>
            <span className="font-serif font-bold text-gray-900 dark:text-white text-[15px] tracking-tight">IPL Solver</span>
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-[0.2em] mt-0.5">Scouting Hub</div>
          </div>
        </Link>
        
        {/* Mobile Close Button */}
        <button 
          onClick={closeSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={closeSidebar}
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active')
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User pill */}
      {user && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-dark-700">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-bold text-xs">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.username}</div>
              <div className="text-[10px] uppercase text-gray-400 tracking-widest">{user.role}</div>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
