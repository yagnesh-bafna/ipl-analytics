import { useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/layout/Layout'
import Header from '../components/layout/Header'
import { submitContact } from '../lib/api'
import { Mail, Send, MapPin, Clock } from 'lucide-react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error'

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) return
    setLoading(true)
    const { ok } = await submitContact(form)
    setLoading(false)
    if (ok) {
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } else {
      setStatus('error')
    }
    setTimeout(() => setStatus(null), 4000)
  }

  return (
    <Layout>
      <div className="flex flex-col h-full p-4 sm:p-8 overflow-hidden">
        <div className="flex-shrink-0">
          <Header title="Contact Us" subtitle="Send us a message — our analysts respond within 24 business hours." />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Form Section */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-card p-6 sm:p-8">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Send a Message</h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Name</label>
                  <input 
                    type="text" value={form.name} onChange={set('name')} 
                    placeholder="John Doe" 
                    className="form-input h-12 bg-gray-100/50 dark:bg-dark-800/50" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input 
                    type="email" value={form.email} onChange={set('email')} 
                    placeholder="email@example.com" 
                    className="form-input h-12 bg-gray-100/50 dark:bg-dark-800/50" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Message</label>
                  <textarea
                    value={form.message} onChange={set('message')}
                    rows={6} placeholder="How can we assist your analytics team?"
                    className="form-input bg-gray-100/50 dark:bg-dark-800/50 resize-none p-4"
                  />
                </div>

                {status === 'success' && (
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm font-bold flex items-center gap-2">
                    <span className="text-base">✓</span> Message transmission successful. Analysts alerted.
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold">
                    Transmission failed. Please verify connection and try again.
                  </motion.div>
                )}

                <div className="pt-2">
                  <button 
                    onClick={handleSubmit} disabled={loading} 
                    className="btn-primary w-full sm:w-auto h-12 px-8 flex items-center justify-center gap-2 text-sm font-bold group"
                  >
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    {loading ? 'Transmitting...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Support Info */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4 sm:space-y-6">
              {[
                { icon: Mail,    title: 'Strategic Support', desc: 'support@iplsolver.io', value: 'contact@iplsolver.io' },
                { icon: Clock,   title: 'Response Latency',  desc: '',                      value: 'Within 24 business hours' },
                { icon: MapPin,  title: 'Operations Center', desc: 'Mumbai / Remote',      value: 'IPL Analytics Division' },
              ].map(({ icon: Icon, title, desc, value }) => (
                <div key={title} className="glass-card flex items-start gap-4 p-5 sm:p-6 group hover:translate-x-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">{title}</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{value}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
