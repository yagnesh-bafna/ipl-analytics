import React from 'react'
import './index.css' // Error if I use legacy path
import App from './App'

// Fixing import for React 18
import { createRoot } from 'react-dom/client'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
