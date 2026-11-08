import React from 'react'
import { createRoot } from 'react-dom/client'
import SponsorsPage from './components/SponsorsPage.jsx'
import { initAnalytics } from './analytics.js'
import './styles.css'
import './sponsors.css'

initAnalytics()
createRoot(document.getElementById('root')).render(<SponsorsPage />)
