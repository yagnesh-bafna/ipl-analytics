import { useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { fetchAdminUsers, toggleUserStatus, resetUserPassword } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { RefreshCw } from 'lucide-react'

export default function AdminUsers() {
  const { data: users, loading, error } = useApi(fetchAdminUsers)
  const [msg, setMsg] = useState('')

  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const handleToggle = async (id, current) => {
    if (!confirm('Confirm status change?')) return
    const { ok } = await toggleUserStatus(id, !current)
    if (ok) toast('Status updated. Please refresh to see changes.')
  }

  const handleReset = async (id) => {
    const np = prompt('Enter new temporary password:')
    if (!np) return
    const { ok } = await resetUserPassword(id, np)
    if (ok) toast('Password reset successfully.')
  }

  return (
    <Layout>
      <Header title="Registry Management" subtitle="Monitor and manage system users and roles." />

      {msg && (
        <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">{msg}</div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
        {loading ? <PageLoader /> : error ? (
          <p className="text-red-400 text-sm p-4">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Management</th>
                </tr>
              </thead>
              <tbody>
                {(users || []).map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{u.username}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                    </td>
                    <td><span className="badge badge-primary uppercase">{u.role}</span></td>
                    <td>
                      {u.is_suspended
                        ? <span className="badge badge-danger">Suspended</span>
                        : <span className="badge badge-success">Active</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggle(u.id, u.is_suspended)} className="btn-ghost text-xs px-3 py-1.5">
                          {u.is_suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                        <button onClick={() => handleReset(u.id)} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3" /> Reset Password
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
    </Layout>
  )
}
