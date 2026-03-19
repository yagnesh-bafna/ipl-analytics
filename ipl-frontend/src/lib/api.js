const BASE = import.meta.env.VITE_API_BASE_URL || ''  // Vite proxies to Flask or uses production URL

const req = async (url, opts = {}) => {
  try {
    const res = await fetch(BASE + url, opts)
    const contentType = res.headers.get('content-type')
    let data = {}
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json()
    } else {
      const text = await res.text()
      data = { error: `Server error (${res.status}): ${text.slice(0, 100)}` }
    }
    
    return { ok: res.ok, status: res.status, data }
  } catch (err) {
    return { ok: false, status: 500, data: { error: 'Network error or backend unreachable.' } }
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
export const fetchTrending = () => req('/api/admin/trending')
export const fetchTeamOfTournament = () => req('/api/team_of_tournament')

// ADMIN
export const fetchAdminStats = () => req('/api/admin/stats')
export const fetchAdminUsers = () => req('/api/admin/users')
export const fetchAdminLogs = () => req('/api/admin/logs')
export const removeUser = (userId) => req('/api/admin/user/remove', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user_id: userId }) })
export const resetUserPassword = (userId, newPassword) => req('/api/admin/user/reset_password', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user_id: userId, new_password: newPassword }) })

// CONTACT
export const submitContact = (body) => req('/api/contact', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
