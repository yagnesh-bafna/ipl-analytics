import { motion } from 'framer-motion'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { PageLoader } from '../components/ui/Spinner'
import { fetchAdminLogs } from '../lib/api.js'
import { useApi } from '../hooks/useApi'
import { ScrollText, Calendar, Mail, User } from 'lucide-react'

export default function AdminInquiries() {
  const { data: inquiries, loading, error } = useApi(fetchAdminLogs)

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-hidden">
        <div className="flex-shrink-0">
          <Header title="Recent Inquiries" subtitle="Review and manage communication logs from platform users." />
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
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Contact</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Message Content</th>
                      <th className="py-4 px-6 text-left uppercase text-[11px] font-bold tracking-wider text-gray-500">Received Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                    {(inquiries || []).map((l, i) => (
                      <tr key={i} className="hover:bg-gray-100/30 dark:hover:bg-dark-800/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary-500" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white text-sm">{l.name}</div>
                              <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {l.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-start gap-2 max-w-lg">
                            <ScrollText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                              "{l.message}"
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {l.created_at?.split('T')[0]}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(!loading && inquiries?.length === 0) && (
              <div className="p-12 text-center text-gray-400 italic">No recent inquiries found.</div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
