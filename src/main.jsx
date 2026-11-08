import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { initAnalytics } from './analytics.js'
import { initAutosize } from './autosize.js'
import './styles.css'

initAnalytics()
initAutosize()
createRoot(document.getElementById('root')).render(<App />)
