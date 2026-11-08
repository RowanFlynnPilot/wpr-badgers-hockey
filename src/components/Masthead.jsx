import React, { useState } from 'react'
import { CONFIG } from '../config.js'

// The paper's own newspaper-style header, matching the Brewers tracker:
// press seal + wordmark linked home, the tagline, and a dateline. The
// wordmark is WPR's hosted image; if it can't load, the set-type fallback
// keeps the masthead named rather than blank.
export default function Masthead() {
  const [wordmarkOk, setWordmarkOk] = useState(true)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <header className="masthead">
      <a
        className="masthead__home"
        href={CONFIG.WPR_URL}
        target="_top"
        aria-label="Wausau Pilot & Review home"
      >
        <img
          className="masthead__badge"
          src={CONFIG.WPR_BADGE}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        {wordmarkOk ? (
          <img
            className="masthead__wordmark"
            src={CONFIG.WPR_LOGO}
            alt="Wausau Pilot & Review"
            onError={() => setWordmarkOk(false)}
          />
        ) : (
          <span className="masthead__textmark">Wausau Pilot &amp; Review</span>
        )}
      </a>
      <div className="masthead__tag">{CONFIG.WPR_TAGLINE}</div>
      <div className="masthead__dateline">
        <span>{today}</span>
        <span className="masthead__place">Wausau, Wisconsin</span>
      </div>
    </header>
  )
}
