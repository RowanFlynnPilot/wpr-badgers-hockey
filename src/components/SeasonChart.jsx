import React, { useState } from 'react'
import { CONFIG } from '../config.js'
import { gameDate, gameTime, liveLabel, resultLine, vsAt } from '../format.js'
import { fmt } from '../record.js'

// The season in one graphic: a column per game, the bar's height and
// direction its goal margin (up = win, down = loss, a flat tick = tie).
// Games ahead wait as stubs on the rule; the next one is ringed, a live one
// runs cardinal. Hover, tap or arrow-key through it — the readout above
// names the game. Bars live in a stretched SVG; text stays in HTML so it
// never distorts.
const W = 1000
const H = 120
const PAD = 4

// `label` replaces "Game by game" in the resting readout (the media kit and
// one-pager show one chart per program); `className` adds a variant
// (sc--card: a standalone bordered card, sc--print: compact, no legend).
export default function SeasonChart({ schedule, rec, ranks, label = 'Game by game', className = '' }) {
  const [active, setActive] = useState(null)
  if (!schedule || schedule.length < 2) return null

  const n = schedule.length
  const col = W / n
  const barW = Math.max(col * 0.62, 3)
  const margin = (g) => (g.us.score ?? 0) - (g.them.score ?? 0)
  // The axis sits where the data needs it: an unbeaten team gets the whole
  // height for wins, keeping just enough room below for a loss to show.
  const margins = schedule.filter((g) => g.completed || g.state === 'in').map(margin)
  const up = Math.max(3, ...margins)
  const down = Math.max(1.5, ...margins.map((m) => -m))
  const MID = PAD + ((H - 2 * PAD) * up) / (up + down)
  const unit = (H - 2 * PAD) / (up + down)
  const next = schedule.find((g) => g.state !== 'post')
  // Played games keep the rank the opponent carried that night; games ahead
  // use this week's poll.
  const rankOf = (g) => (g.state === 'pre' && ranks && ranks.get(g.them.id)) || g.them.rank

  const bar = (g, i) => {
    const x = i * col + (col - barW) / 2
    if (g.completed || g.state === 'in') {
      const m = margin(g)
      if (m === 0)
        return <rect key={g.id} x={x} y={MID - 2} width={barW} height={4} className={`sc-bar sc-bar--${g.state === 'in' ? 'live' : 't'}`} />
      const h = Math.max(Math.abs(m) * unit, 4)
      const cls = g.state === 'in' ? 'live' : m > 0 ? 'w' : 'l'
      return <rect key={g.id} x={x} y={m > 0 ? MID - h : MID} width={barW} height={h} className={`sc-bar sc-bar--${cls}`} />
    }
    const isNext = next && g.id === next.id
    return (
      <rect
        key={g.id}
        x={x}
        y={MID - (isNext ? 9 : 3)}
        width={barW}
        height={isNext ? 18 : 6}
        className={`sc-bar sc-bar--${isNext ? 'next' : g.homeAway === 'home' && !g.neutralSite ? 'home' : 'pre'}`}
      />
    )
  }

  // Month ticks under the first game of each month. A month too short to
  // fit its name (two September games) keeps its tick but not its label.
  const months = []
  schedule.forEach((g, i) => {
    const m = gameDate(g, { month: 'short' })
    if (i === 0 || m !== gameDate(schedule[i - 1], { month: 'short' })) months.push([i, m])
  })
  const labelled = months.map(([i, m], k) => [i, (months[k + 1] ? months[k + 1][0] : n) - i >= n * 0.08 ? m : ''])

  const describe = (g) => {
    const rank = rankOf(g)
    const who = `${vsAt(g)} ${rank ? `No. ${rank} ` : ''}${g.them.short}`
    const day = gameDate(g, { weekday: 'short', month: 'short', day: 'numeric' })
    if (g.completed) return `${day} · ${who} · ${resultLine(g)}${g.note ? ` · ${g.note}` : ''}`
    if (g.state === 'in') return `Live · ${who} · ${g.us.score}–${g.them.score}, ${liveLabel(g)}`
    const time = gameTime(g)
    return `${day} · ${who}${time ? ` · ${time} ${CONFIG.TIMEZONE_LABEL}` : ''}${g.note ? ` · ${g.note}` : ''}`
  }

  const left = schedule.length - rec.played
  const summary = rec.played
    ? `${fmt(rec.overall)} · ${rec.goalDiff > 0 ? '+' : ''}${rec.goalDiff} goal differential · ${left} to play`
    : `All ${n} games ahead`
  const shown = active === null ? null : schedule[active]

  const pick = (e) => {
    const box = e.currentTarget.getBoundingClientRect()
    const i = Math.floor(((e.clientX - box.left) / box.width) * n)
    setActive(Math.min(n - 1, Math.max(0, i)))
  }
  const onKey = (e) => {
    const from = active === null ? schedule.indexOf(next || schedule[n - 1]) : active
    if (e.key === 'ArrowRight') setActive(Math.min(n - 1, from + (active === null ? 0 : 1)))
    else if (e.key === 'ArrowLeft') setActive(Math.max(0, from - (active === null ? 0 : 1)))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(n - 1)
    else if (e.key === 'Escape') setActive(null)
    else return
    e.preventDefault()
  }

  return (
    <div className={`sc ${className}`.trim()}>
      <div className="sc__readout" aria-live="polite">
        {shown ? (
          <>
            <span className="sc__num">Game {active + 1}</span> {describe(shown)}
          </>
        ) : (
          <>
            <span className="sc__num">{label}</span> {summary}
          </>
        )}
      </div>
      <div
        className="sc__plot"
        tabIndex={0}
        role="group"
        aria-label={`Season chart, ${n} games. ${summary}. Use the arrow keys to step through games.`}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setActive(null)
        }}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          {shown && (
            <rect x={active * col} y={0} width={col} height={H} className="sc-hover" />
          )}
          <line x1={0} x2={W} y1={MID} y2={MID} className="sc-axis" vectorEffect="non-scaling-stroke" />
          {schedule.map(bar)}
        </svg>
      </div>
      <div className="sc__months" aria-hidden="true">
        {labelled.map(([i, m]) => (
          <span key={i} style={{ left: `${(i / n) * 100}%` }}>
            {m}
          </span>
        ))}
      </div>
      <div className="sc__legend" aria-hidden="true">
        <span><i className="sc-key sc-key--w" />Win</span>
        <span><i className="sc-key sc-key--l" />Loss</span>
        <span><i className="sc-key sc-key--t" />Tie</span>
        <span><i className="sc-key sc-key--next" />Next</span>
        <span><i className="sc-key sc-key--home" />Home date ahead</span>
        <span className="sc__legendnote">Bar height = goal margin</span>
      </div>
    </div>
  )
}
