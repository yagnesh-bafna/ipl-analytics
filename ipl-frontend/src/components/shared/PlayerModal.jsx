import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchPlayerProfile } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../ui/Modal'
import { PageLoader } from '../ui/Spinner'

export default function PlayerModal({ name, onClose, onAdd, type }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!name) return
    setLoading(true)
    fetchPlayerProfile(name, user?.id).then(({ ok, data }) => {
      if (ok) setData(data)
      setLoading(false)
    })
  }, [name, user?.id])

  return (
    <Modal open={!!name} onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        {loading ? (
          <PageLoader />
        ) : data ? (
          <>
              <div className="flex items-center justify-between gap-4 pr-12">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h2>
                    {data.player_info?.[0]?.cricket_country && (
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                        data.player_info[0].cricket_country.toLowerCase() === 'india' 
                        ? 'text-gray-400 border-gray-200 dark:border-dark-700' 
                        : 'text-secondary-500 border-secondary-500/30 bg-secondary-500/5'
                      }`}>
                        {data.player_info[0].cricket_country.toLowerCase() === 'india' ? 'Ind' : `${data.player_info[0].cricket_country.substring(0,3).toUpperCase()} Os`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {data.player_info?.[0]?.age ? `${data.player_info[0].age} Years • ` : ''} Performance History
                  </p>
                </div>
                {onAdd && (
                  <button 
                    onClick={() => { onAdd(name, type, data.player_info?.[0]?.cricket_country || 'India'); onClose(); }}
                    className="btn-primary py-2 px-4 text-sm"
                  >
                    Add to Squad
                  </button>
                )}
              </div>

            {data.batting?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-500 mb-3">Batting Stats</h4>
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
                    <thead><tr><th>Season</th><th>Runs</th><th>Balls</th><th>SR</th></tr></thead>
                    <tbody>{data.batting.map((s, i) => (
                      <tr key={i}><td>{s.season}</td><td>{s.runs}</td><td>{s.balls}</td><td>{(s.strike_rate || 0).toFixed(1)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {data.bowling?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-3">Bowling Stats</h4>
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
                    <thead><tr><th>Season</th><th>Wickets</th><th>Economy</th></tr></thead>
                    <tbody>{data.bowling.map((s, i) => (
                      <tr key={i}><td>{s.season}</td><td>{s.wickets}</td><td>{(s.economy || 0).toFixed(2)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {!data.batting?.length && !data.bowling?.length && (
              <p className="text-center text-gray-400 py-8">No historical data available.</p>
            )}
          </>
        ) : (
          <p className="text-center text-red-400 py-8">Failed to load player data.</p>
        )}
      </div>
    </Modal>
  )
}
