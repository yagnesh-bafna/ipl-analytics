const BASE = import.meta.env.VITE_API_BASE_URL || ''  // Vite proxies to Flask or uses production URL

// Track the latest latency for the UI
let lastLatency = 0
export const getLastLatency = () => lastLatency

const req = async (url, opts = {}, timeoutMs = 25000) => {
  const fullUrl = BASE + url
  console.log(`[API] Request: ${opts.method || 'GET'} ${fullUrl}`)
  
  // Use AbortController for timeout (important for Render free tier cold starts)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  const start = performance.now()
  try {
    const res = await fetch(fullUrl, { ...opts, signal: controller.signal })
    const end = performance.now()
    lastLatency = Math.round(end - start)
    
    clearTimeout(timeoutId)
    console.log(`[API] Response: ${res.status} ${res.statusText} (${lastLatency}ms)`)
    
    const contentType = res.headers.get('content-type')
    let data = {}
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json()
    } else {
      const text = await res.text()
      console.warn(`[API] Non-JSON response received: ${text.slice(0, 200)}`)
      data = { error: `Server error (${res.status}): Please wait a moment while the server wakes up.` }
    }
    
    return { ok: res.ok, status: res.status, data }
  } catch (err) {
    clearTimeout(timeoutId)
    console.error(`[API] Fetch Error:`, err)
    
    if (err.name === 'AbortError') {
      return { ok: false, status: 408, data: { error: 'Request timed out. The server might be waking up (cold start). Please try again in 10 seconds.' } }
    }
    
    return { ok: false, status: 500, data: { error: 'Network error: Backend might be down or unreachable.' } }
  }
}

// AUTH
export const apiLogin = (body) => req('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
export const apiSignup = (body) => req('/api/signup', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
export const apiGoogleLogin = (token) => req('/api/google-login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ token }) })

// USER
export const fetchUserStats = (userId) => req(`/api/user/stats?user_id=${userId}`)
export const saveTeam = (userId, team) => req('/api/team/save', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user_id: userId, dream_team: JSON.stringify(team) }) })
export const loadTeam = (userId) => req(`/api/team/load?user_id=${userId}`)

// SCOUTING
export const fetchBatting = () => req('/api/batting')
export const fetchBowling = () => req('/api/bowling')
export const fetchAllRounder = () => req('/api/all_rounder')
export const fetchPlayerProfile = (name, userId) => req(`/player/${encodeURIComponent(name)}${userId ? `?user_id=${userId}` : ''}`)

// ANALYTICS
export const fetchMatrix = () => req('/api/matrix')
export const fetchMagicFill = () => req('/api/magic_fill', {}, 45000) // 45s timeout for heavy analytics
export const fetchTrending = () => req('/api/admin/trending')
export const fetchTeamOfTournament = () => req('/api/team_of_tournament')

// ADMIN
export const fetchAdminStats = () => req('/api/admin/stats')
export const fetchAdminUsers = () => req('/api/admin/users')
export const fetchAdminLogs = () => req('/api/admin/logs')
export const removeUser = (userId) => req('/api/admin/user/remove', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user_id: userId }) })

// CONTACT
export const submitContact = (body) => req('/api/contact', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
