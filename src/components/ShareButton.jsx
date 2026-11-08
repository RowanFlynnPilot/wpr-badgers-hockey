import React from 'react'
import { CONFIG } from '../config.js'
import { track } from '../analytics.js'

// Native share sheet only. Where there is no navigator.share (most
// desktops) the ☆ Bookmark chip already owns copy-a-link — with a manual
// fallback — and a second clipboard button would duplicate it while
// failing silently in embeds without clipboard-write permission. When
// embedded, share the hosting WPR page rather than the bare iframe URL —
// same manners as the Brewers hero.
export default function ShareButton({ text }) {
  if (typeof navigator === 'undefined' || !navigator.share) return null

  const onClick = () => {
    const url =
      window.self === window.top
        ? window.location.href
        : document.referrer || CONFIG.CANONICAL_URL
    track('Share')
    navigator
      .share({ title: 'Badgers tracker — Wausau Pilot & Review', text, url })
      .catch(() => {})
  }

  return (
    <button className="chipbtn" onClick={onClick}>
      ↗ Share
    </button>
  )
}
