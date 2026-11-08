import React from 'react'
import { createRoot } from 'react-dom/client'
import MiniGame from './components/MiniGame.jsx'
import { initAnalytics } from './analytics.js'
import { initAutosize } from './autosize.js'
import './styles.css'
import './mini.css'

initAnalytics()
initAutosize()
createRoot(document.getElementById('root')).render(<MiniGame />)
