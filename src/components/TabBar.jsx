import React, { useRef } from 'react'

// Real ARIA tabs, keyboard included: the role promises arrow-key movement,
// so Left/Right/Home/End move and activate with a roving tabindex. The
// active tab labels the single #tabpanel wrapper in App.jsx.
export default function TabBar({ tabs, active, onSelect }) {
  const refs = useRef([])

  const onKeyDown = (e) => {
    const current = tabs.indexOf(active)
    let next = null
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next === null) return
    e.preventDefault()
    onSelect(tabs[next])
    const btn = refs.current[next]
    if (btn) btn.focus()
  }

  return (
    <nav
      className="tabbar"
      role="tablist"
      aria-label="Tracker sections"
      onKeyDown={onKeyDown}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab}
          ref={(el) => {
            refs.current[i] = el
          }}
          id={`tab-${tab}`}
          role="tab"
          aria-selected={active === tab}
          aria-controls="tabpanel"
          tabIndex={active === tab ? 0 : -1}
          className="tab"
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
