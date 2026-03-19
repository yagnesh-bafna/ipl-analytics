import { useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { fetchAdminUsers, removeUser, resetUserPassword } from '../lib/api.js'
import { useApi } from '../hooks/useApi'
import { RefreshCw, Trash2 } from 'lucide-react'
import clsx from 'clsx'

export default function AdminUsers() {
  const { data: users, loading, error, setData } = useApi(fetchAdminUsers)
  const [msg, setMsg] = useState('')

  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const handleRemove = async (id) => {
    if (!confirm('Are you sure you want to permanently remove this user? This action cannot be undone.')) return
    const { ok } = await removeUser(id)
    if (ok) {
      toast('User has been removed.')
      setData(users.filter(u => u.id !== id)) // Optimistic UI update
    }
  }

  const handleReset = async (id) => {
    const np = prompt('Enter new temporary password:')
    if (!np) return
    const { ok } = await resetUserPassword(id, np)
    if (ok) toast('Password reset successfully.')
  }

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-hidden">
        <div className="flex-shrink-0">
          <Header title="User Registry" subtitle="Monitor and manage system users and roles." />

          {msg && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-bold">
              {msg}
            </motion.div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-0 overflow-hidden">
            {loading ? <PageLoader /> : error ? (
              <p className="text-red-400 text-sm p-8 font-medium">{error}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-dark-900/95 backdrop-blur shadow-sm">
                    <tr>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Identity</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Role</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Status</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                    {(users || []).map(u => (
                      <tr key={u.id} className="hover:bg-gray-100/30 dark:hover:bg-dark-800/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900 dark:text-white text-sm">{u.username}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="badge bg-primary-500/10 text-primary-500 uppercase font-black text-[10px]">{u.role}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={clsx(
                            "badge font-bold text-xs",
                            u.status === 'Active' 
                              ? "bg-emerald-500/10 text-emerald-500" 
                              : "bg-gray-500/10 text-gray-500"
                          )}>{u.status}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-start gap-2">
                            <button 
                              onClick={() => handleRemove(u.id)} 
                              className="h-9 px-4 rounded-lg text-xs font-bold transition-all border bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                            <button 
                              onClick={() => handleReset(u.id)} 
                              className="h-9 px-4 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-dark-600 transition-all flex items-center gap-2"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Reset Password
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
