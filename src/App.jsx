import React, { useEffect, useRef, useState } from 'react'
import { CONFIG } from './config.js'
import { fetchSchedule, fetchStandings, fetchPoll } from './api.js'
import { track } from './analytics.js'
import { gameDate, gameTime, vsAt } from './format.js'
import { records } from './record.js'
import Masthead from './components/Masthead.jsx'
import BadgersBanner from './components/BadgersBanner.jsx'
import ProgramToggle from './components/ProgramToggle.jsx'
import TabBar from './components/TabBar.jsx'
import BookmarkButton from './components/BookmarkButton.jsx'
import ShareButton from './components/ShareButton.jsx'
import Hero from './components/Hero.jsx'
import Pulse from './components/Pulse.jsx'
import Standings from './components/Standings.jsx'
import Rankings from './components/Rankings.jsx'
import Schedule from './components/Schedule.jsx'
import LastGame from './components/LastGame.jsx'
import Roster from './components/Roster.jsx'
import Coverage from './components/Coverage.jsx'
import { Loading, ErrorState } from './components/Status.jsx'

const TABS = ['Season', 'Schedule', 'Team']
const PROGRAMS = Object.keys(CONFIG.TEAMS)

// Deep links: ?team=womens picks the program, ?tab=Schedule the tab (the
// media kit's "see it live" links use them). With no ?team, open on
// whichever program plays next — the one a reader most likely came for.
const params = new URLSearchParams(window.location.search)
const initialTab = TABS.includes(params.get('tab')) ? params.get('tab') : TABS[0]
const requestedTeam = PROGRAMS.includes(params.get('team')) ? params.get('team') : null

export default function App() {
  const [team, setTeam] = useState(requestedTeam || 'mens')
  const [tab, setTab] = useState(initialTab)
  const [data, setData] = useState({}) // team -> { schedule, standings, poll }
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const hasData = useRef(false)
  const picked = useRef(Boolean(requestedTeam))

  useEffect(() => {
    // Both programs poll every 60s — the toggle is instant, and the default
    // program can be chosen by who plays next. A failed poll keeps the last
    // good data; the error screen only appears if the FIRST load fails.
    const load = () => {
      for (const key of PROGRAMS) {
        const set = (field) => (value) =>
          setData((d) => ({ ...d, [key]: { ...d[key], [field]: value } }))
        fetchSchedule(key)
          .then((games) => {
            hasData.current = true
            set('schedule')(games)
            setUpdatedAt(new Date())
            setError(null)
          })
          .catch((err) => {
            if (!hasData.current) setError(err)
          })
        fetchStandings(key).then(set('standings')).catch(() => {})
        fetchPoll(key).then(set('poll')).catch(() => {})
      }
    }
    load()
    const tick = () => {
      if (!document.hidden) load()
    }
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  // First load only, no deep link: a live game wins, else the sooner next game.
  const mens = data.mens && data.mens.schedule
  const womens = data.womens && data.womens.schedule
  useEffect(() => {
    if (picked.current || !mens || !womens) return
    picked.current = true
    const score = (s) => {
      if (s.some((g) => g.state === 'in')) return -Infinity
      const next = s.find((g) => g.state === 'pre')
      return next ? next.date.getTime() : Infinity
    }
    setTeam(score(womens) < score(mens) ? 'womens' : 'mens')
  }, [mens, womens])

  const selectTeam = (next) => {
    picked.current = true
    setTeam(next)
    track('Program', { team: next })
  }
  const selectTab = (next) => {
    setTab(next)
    track('Tab', { tab: next })
  }

  const current = data[team] || {}
  const { schedule, standings, poll } = current
  if (error && !schedule) return <Shell><ErrorState message={error.message} /></Shell>
  if (!schedule) return <Shell><Loading /></Shell>

  const program = CONFIG.TEAMS[team]
  const conferenceIds = new Set(
    program.conferenceIds || (standings || []).map((s) => s.teamId),
  )
  const rec = records(schedule, conferenceIds.size ? conferenceIds : null)
  const gamesPlayed = schedule.filter((g) => g.completed)
  const ourRank = poll
    ? (poll.ranks.find((r) => r.teamId === CONFIG.TEAM_ID) || {}).current || null
    : null

  return (
    <Shell updatedAt={updatedAt} share={buildShareLine(team, schedule)}>
      <ProgramToggle team={team} onSelect={selectTeam} />
      <TabBar tabs={TABS} active={tab} onSelect={selectTab} />

      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'Season' && (
          <>
            <Hero team={team} schedule={schedule} ourRank={ourRank} rec={rec} />
            {/* The recap lives up top: it's the first thing a reader wants
                the morning after, not something to find under 33 rows. */}
            <LastGame team={team} games={gamesPlayed} />
            <Pulse team={team} rec={rec} />
            <Standings team={team} entries={standings} />
            <Rankings poll={poll} schedule={schedule} />
          </>
        )}

        {tab === 'Schedule' && (
          <>
            <Schedule team={team} games={schedule} conferenceIds={conferenceIds} />
          </>
        )}

        {tab === 'Team' && <TeamTab key={team} team={team} />}
      </div>

      <Coverage team={team} />
    </Shell>
  )
}

// ESPN serves no women's roster; say so plainly instead of a blank tab.
function TeamTab({ team }) {
  const [empty, setEmpty] = useState(false)
  return (
    <>
      <Roster team={team} onEmpty={() => setEmpty(true)} />
      {empty && (
        <p className="emptynote">
          ESPN doesn't publish a {CONFIG.TEAMS[team].label.toLowerCase()} roster.{' '}
          <a href={CONFIG.TEAMS[team].rosterUrl} target="_blank" rel="noopener">
            See the full roster on uwbadgers.com →
          </a>
        </p>
      )}
    </>
  )
}

// One line that travels well in a share sheet, mirroring the hero's state.
function buildShareLine(team, schedule) {
  const who = `Badgers ${CONFIG.TEAMS[team].label.toLowerCase()} hockey`
  const live = schedule.find((g) => g.state === 'in')
  if (live) return `${who} ${live.us.score}–${live.them.score} ${vsAt(live)} ${live.them.short} — live now`
  const next = schedule.find((g) => g.state === 'pre')
  if (next) {
    const time = gameTime(next)
    return `${who} ${vsAt(next)} ${next.them.short}, ${gameDate(next, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })}${time ? `, ${time} ${CONFIG.TIMEZONE_LABEL}` : ''}`
  }
  return ''
}

function Shell({ updatedAt, share, children }) {
  return (
    <>
      <div className="wrap wrap--head">
        <Masthead />
        <BadgersBanner />
      </div>
      <div className="stripe" role="presentation" />
      <div className="wrap">
        <div className="topbar">
          <span className="updated">
            {updatedAt
              ? `Live from ESPN · updated ${updatedAt.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: CONFIG.TIMEZONE,
                })} ${CONFIG.TIMEZONE_LABEL}`
              : 'Live from ESPN'}
          </span>
          <span className="topbar__actions">
            {share && <ShareButton text={share} />}
            <BookmarkButton />
          </span>
        </div>
        {children}
        <footer className="footer">
          <img
            className="footer__badge"
            src={CONFIG.WPR_BADGE}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div>
            <p>
              Data: ESPN public APIs, fetched live in your browser. Team marks
              are referenced from ESPN's CDN. Wausau Pilot &amp; Review is not
              affiliated with or endorsed by the University of Wisconsin, the
              Big Ten Conference, the WCHA or ESPN.
            </p>
            {CONFIG.TITLE_SPONSOR && CONFIG.TITLE_SPONSOR.disclaimer && (
              <p>{CONFIG.TITLE_SPONSOR.disclaimer}</p>
            )}
            <p>Wausau Pilot &amp; Review · 715-301-5539</p>
            <p>
              <a className="footer__sponsorlink" href="sponsors.html" target="_blank" rel="noopener">
                Put your business on this tracker →
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
