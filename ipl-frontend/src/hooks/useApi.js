import { useState, useEffect } from 'react'

export function useApi(apiFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiFn().then(({ ok, data }) => {
      if (cancelled) return
      if (ok) setData(data)
      else setError(data?.error || 'An error occurred')
      setLoading(false)
    }).catch(e => {
      if (!cancelled) { setError(e.message); setLoading(false) }
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
