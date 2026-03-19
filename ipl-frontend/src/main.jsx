import React from 'react'
import './index.css' // Error if I use legacy path
import App from './App'

// Fixing import for React 18
import { createRoot } from 'react-dom/client'

import { GoogleOAuthProvider } from '@react-oauth/google'

const container = document.getElementById('root')
const root = createRoot(container)

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!GOOGLE_CLIENT_ID) {
  console.error("VITE_GOOGLE_CLIENT_ID is missing in environment variables.")
}

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
)
