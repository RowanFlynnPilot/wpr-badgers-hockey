import React from 'react'
import { CONFIG } from '../config.js'
import { gameDate, gameTime, liveLabel, resultLine, vsAt, whereLine } from '../format.js'
import Section from './Section.jsx'
import Sponsor from './Sponsor.jsx'

const RESULT_CLASS = { W: 'w', L: 'l', T: 't' }

// Weekday / date / time stacked — the narrow date column used to break
// "Fri, Oct" from "2".
function When({ game }) {
  const time = game.completed || game.state === 'in' ? null : gameTime(game) || 'TBA'
  return (
    <div className="game__when">
      <span>{gameDate(game, { weekday: 'short' })}</span>
      <span className="game__date">{gameDate(game, { month: 'short', day: 'numeric' })}</span>
      {time && <span>{time}</span>}
    </div>
  )
}

// 30-plus games read as a wall without structure: month headers break the
// season up, the next game is flagged, and a jump link reaches it (by
// February it sits two dozen rows down).
export default function Schedule({ team, games, conferenceIds }) {
  const program = CONFIG.TEAMS[team]
  const next = games.find((g) => g.state !== 'post')
  const month = (g) => gameDate(g, { month: 'long', year: 'numeric' })

  const rows = []
  games.forEach((game, i) => {
    if (i === 0 || month(game) !== month(games[i - 1]))
      rows.push(
        <h3 className="slate__month" key={`m-${game.id}`}>
          {gameDate(game, { month: 'long' })}
        </h3>,
      )
    const isNext = next && game.id === next.id
    rows.push(
      <div
        key={game.id}
        id={isNext ? 'next-game' : undefined}
        className={`game${game.homeAway === 'home' && !game.neutralSite ? ' game--home' : ''}${
          isNext ? ' game--next' : ''
        }`}
      >
        <When game={game} />
        <div className="game__opp">
          {/* Same-size stand-in when ESPN has no mark (e.g. Robert Morris),
              so names stay aligned down the column. */}
          {game.them.logo ? (
            <img src={game.them.logo} alt="" loading="lazy" />
          ) : (
            <span className="game__nologo" aria-hidden="true">
              {game.them.abbrev}
            </span>
          )}
          <div>
            <div className="game__name">
              {isNext && (
                <span className="tag tag--next">{game.state === 'in' ? 'Live' : 'Next'}</span>
              )}
              {vsAt(game)}{' '}
              {game.them.rank && <span className="rankchip">#{game.them.rank} </span>}
              {game.them.short}
              {conferenceIds.has(game.them.id) && !game.postseason && (
                <span className="tag">{program.conference}</span>
              )}
              {game.neutralSite && <span className="tag">Neutral</span>}
              {CONFIG.RIVALRIES[game.them.id] && (
                <span className="tag tag--trophy">{CONFIG.RIVALRIES[game.them.id]}</span>
              )}
            </div>
            <div className="game__venue">{whereLine(game)}</div>
          </div>
        </div>
        <div className="game__right">
          {game.completed ? (
            <span className={`game__result game__result--${RESULT_CLASS[game.result]}`}>
              {resultLine(game)}
            </span>
          ) : game.state === 'in' ? (
            <span className="game__result">
              {game.us.score}–{game.them.score} · {liveLabel(game)}
            </span>
          ) : (
            game.tv
          )}
        </div>
      </div>,
    )
  })

  return (
    <Section
      title={`The ${CONFIG.SEASON_LABEL} ${program.label.toLowerCase()} slate`}
      sub={`${games.length} games. Home games carry the cardinal edge. All times Central.`}
    >
      {next && games.indexOf(next) > 3 && (
        <a
          className="slate__jump"
          href="#next-game"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('next-game').scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
        >
          Jump to the next game ↓
        </a>
      )}
      <div className="slate">{rows}</div>
      <Sponsor slot={CONFIG.SCHEDULE_SPONSOR} placement="schedule" className="sponsorband" />
    </Section>
  )
}
