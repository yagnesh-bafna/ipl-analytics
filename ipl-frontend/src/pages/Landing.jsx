import { motion } from 'framer-motion'
import { BarChart3, ArrowRight, Database, Zap, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const features = [
  { icon: BarChart3, title: 'Batting Scouting',  desc: 'Deep-dive batting analytics with strike rate, averages, and boundary metrics.' },
  { icon: Zap,       title: 'Smart Squad AI',    desc: 'Build optimal 11-player squads powered by algorithmic tournament data.' },
  { icon: Database,  title: 'Player Matrix',     desc: 'Classify every player across four impact tiers—Superstar to Replacement.' },
  { icon: Shield,    title: 'Auction Predictor', desc: 'Age-risk profiling and three-year trajectory recommendations.' },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          {/* Logo mark */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25"
          >
            <BarChart3 className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
            IPL Solver<span className="text-primary-500">.</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto">
            The next generation of cricket decision analytics. Data meets intuition — powered by real IPL data.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => navigate('/auth')} className="btn-primary flex items-center gap-2 text-base px-8 py-3">
              Enter Platform <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/auth?tab=signup')} className="btn-ghost text-base px-8 py-3">
              Create Account
            </button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl"
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={cardVariants} className="glass-card text-left group hover:border-primary-500/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                <Icon className="w-5 h-5 text-primary-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-dark-800">
        IPL Solver — Advanced Cricket Decision Analytics
      </footer>
    </div>
  )
}
