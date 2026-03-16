import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Eye, EyeOff } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiLogin, apiSignup } from '../lib/api'
import { useAuth } from '../context/AuthContext'

function InputField({ label, id, type = 'text', placeholder, value, onChange }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="form-input pr-10"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function RoleTabs({ role, setRole, prefix = '' }) {
  return (
    <div className="flex gap-2 mb-5 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl">
      {['user', 'admin'].map(r => (
        <button
          key={r}
          type="button"
          onClick={() => setRole(r)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            role === r
              ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </button>
      ))}
    </div>
  )
}

const ADMIN_SECRET = 'IPL_ADMIN_2026'

export default function Auth() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') === 'signup' ? 'signup' : 'login')
  const [role, setRole] = useState('user')
  const [form, setForm] = useState({ username: '', email: '', password: '', adminKey: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleLogin = async () => {
    if (!form.username || !form.password) return setError('Please fill in all fields.')
    if (role === 'admin' && !form.adminKey) return setError('Admin passkey required.')
    setLoading(true); setError('')
    const { ok, data } = await apiLogin({ username: form.username, password: form.password, role, admin_key: form.adminKey || null })
    setLoading(false)
    if (ok) { login(data.user); navigate('/dashboard') }
    else setError(data.error || 'Login failed')
  }

  const handleSignup = async () => {
    if (!form.username || !form.email || !form.password) return setError('Please fill in all fields.')
    if (role === 'admin' && !form.adminKey) return setError('Admin invite key required.')
    setLoading(true); setError('')
    const { ok, data } = await apiSignup({ username: form.username, email: form.email, password: form.password, role, admin_key: form.adminKey })
    setLoading(false)
    if (ok) { setTab('login'); setError(''); setForm(f => ({ ...f, password: '' })) }
    else setError(data.error || 'Signup failed')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-8 shadow-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-sm">IPL Solver</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest">Decision Analytics</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl mb-6">
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t
                    ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <RoleTabs role={role} setRole={setRole} />

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'login' ? 10 : -10 }}
              transition={{ duration: 0.2 }}
            >
              <InputField label="Username" id="username" placeholder="Enter username" value={form.username} onChange={set('username')} />
              {tab === 'signup' && (
                <InputField label="Email" id="email" type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} />
              )}
              <InputField label="Password" id="password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
              {role === 'admin' && (
                <InputField label="Admin Passkey" id="adminKey" type="password" placeholder="Invite key" value={form.adminKey} onChange={set('adminKey')} />
              )}

              {error && (
                <div className="mt-2 mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={tab === 'login' ? handleLogin : handleSignup}
                disabled={loading}
                className="btn-primary w-full mt-2 py-3 text-sm"
              >
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign In to Dashboard' : 'Create Account'}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <button onClick={() => navigate('/')} className="hover:text-primary-500 transition-colors">← Back to Home</button>
        </p>
      </motion.div>
    </div>
  )
}
