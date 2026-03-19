import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Eye, EyeOff, Mail, KeyRound, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiLogin, apiSignup, apiGoogleLogin, apiForgotPassword, apiVerifyOtp, apiResetPassword } from '../lib/api.js'
import { useAuth } from '../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'

function InputField({ label, id, type = 'text', placeholder, value, onChange, icon: Icon }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`form-input pr-10 ${Icon ? 'pl-10' : ''}`}
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
  const [view, setView] = useState('auth') // auth, forgot, otp, reset
  const [tab, setTab] = useState(params.get('tab') === 'signup' ? 'signup' : 'login')
  const [role, setRole] = useState('user')
  const [form, setForm] = useState({ username: '', email: '', password: '', adminKey: '', otp: '', newPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleLogin = async () => {
    if (!form.username || !form.password) return setError('Please fill in all fields.')
    if (role === 'admin' && !form.adminKey) return setError('Admin passkey required.')
    setLoading(true); setError(''); setMessage('')
    const { ok, data } = await apiLogin({ username: form.username, password: form.password, role, admin_key: form.adminKey || null })
    setLoading(false)
    if (ok) { login(data.user); navigate('/dashboard') }
    else setError(data.error || 'Login failed')
  }

  const handleSignup = async () => {
    if (!form.username || !form.email || !form.password) return setError('Please fill in all fields.')
    if (role === 'admin' && !form.adminKey) return setError('Admin invite key required.')
    setLoading(true); setError(''); setMessage('')
    const { ok, data } = await apiSignup({ username: form.username, email: form.email, password: form.password, role, admin_key: form.adminKey })
    setLoading(false)
    if (ok) { setTab('login'); setError(''); setForm(f => ({ ...f, password: '' })); setMessage('Signup successful! Please sign in.') }
    else setError(data.error || 'Signup failed')
  }

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true); setError(''); setMessage('')
    const { ok, data } = await apiGoogleLogin(credentialResponse.credential)
    setLoading(false)
    if (ok) { login(data.user); navigate('/dashboard') }
    else setError(data.error || 'Google login failed')
  }

  const handleForgotPassword = async () => {
    if (!form.email) return setError('Please enter your email address.')
    setLoading(true); setError(''); setMessage('')
    const { ok, data } = await apiForgotPassword(form.email)
    setLoading(false)
    if (ok) {
      setMessage(data.message)
      setView('otp')
    } else {
      setError(data.error || 'Failed to send reset email.')
    }
  }

  const handleVerifyOtp = async () => {
    if (!form.otp) return setError('Please enter the OTP.')
    setLoading(true); setError(''); setMessage('')
    const { ok, data } = await apiVerifyOtp(form.email, form.otp)
    setLoading(false)
    if (ok) {
      setMessage(data.message)
      setView('reset')
    } else {
      setError(data.error || 'OTP verification failed.')
    }
  }

  const handleResetPassword = async () => {
    if (!form.newPassword) return setError('Please enter a new password.')
    setLoading(true); setError(''); setMessage('')
    const { ok, data } = await apiResetPassword(form.email, form.otp, form.newPassword)
    setLoading(false)
    if (ok) {
      setMessage('Password reset successfully! You can now sign in with your new password.')
      setView('auth')
      setTab('login')
      setForm({ username: '', email: '', password: '', adminKey: '', otp: '', newPassword: '' })
    } else {
      setError(data.error || 'Password reset failed.')
    }
  }

  const renderAuth = () => (
    <>
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl mb-6">
        {['login', 'signup'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); setMessage('') }}
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

          {tab === 'login' && (
            <div className="text-right mb-4">
              <button onClick={() => setView('forgot')} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                Forgot Password?
              </button>
            </div>
          )}

          <button
            onClick={tab === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            className="btn-primary w-full mt-2 py-3 text-sm"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In to Dashboard' : 'Create Account'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-dark-700"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-gray-400"><span className="bg-white dark:bg-dark-800 px-2">Or continue with</span></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setError('Google Authentication Failed. Ensure http://localhost:5173 is allowed in Google Console.')}
              useOneTap
              theme="filled_blue"
              shape="pill"
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )

  const renderForgot = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Reset Password</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your email to receive a password reset code.</p>
      <InputField label="Email" id="email" type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} icon={Mail} />
      <button onClick={handleForgotPassword} disabled={loading} className="btn-primary w-full mt-2 py-3 text-sm">
        {loading ? 'Sending...' : 'Send Reset Code'}
      </button>
    </motion.div>
  )

  const renderOtp = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Verify Code</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">A 6-digit code has been sent to <span className="font-bold text-primary-500">{form.email}</span>.</p>
      <InputField label="OTP Code" id="otp" placeholder="123456" value={form.otp} onChange={set('otp')} icon={KeyRound} />
      <button onClick={handleVerifyOtp} disabled={loading} className="btn-primary w-full mt-2 py-3 text-sm">
        {loading ? 'Verifying...' : 'Verify & Proceed'}
      </button>
    </motion.div>
  )

  const renderReset = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Set New Password</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your OTP has been verified. Please set a new password.</p>
      <InputField label="New Password" id="newPassword" type="password" placeholder="••••••••" value={form.newPassword} onChange={set('newPassword')} />
      <button onClick={handleResetPassword} disabled={loading} className="btn-primary w-full mt-2 py-3 text-sm">
        {loading ? 'Saving...' : 'Save New Password'}
      </button>
    </motion.div>
  )

  const renderContent = () => {
    switch (view) {
      case 'forgot': return renderForgot()
      case 'otp': return renderOtp()
      case 'reset': return renderReset()
      default: return renderAuth()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-8 shadow-xl relative">
          {view !== 'auth' && (
            <button onClick={() => { setView('auth'); setError(''); setMessage('') }} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-sm">IPL Solver</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest">Decision Analytics</div>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
              {message}
            </div>
          )}

          {renderContent()}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <button onClick={() => navigate('/')} className="hover:text-primary-500 transition-colors">← Back to Home</button>
        </p>
      </motion.div>
    </div>
  )
}
