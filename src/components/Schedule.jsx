import React from 'react'
import { CONFIG } from '../config.js'
import { gameDate, gameTime, liveLabel, resultLine, vsAt } from '../format.js'
import Section from './Section.jsx'
import Sponsor from './Sponsor.jsx'

function when(game) {
  const date = gameDate(game, { weekday: 'short', month: 'short', day: 'numeric' })
  if (game.completed || game.state === 'in') return date
  const time = gameTime(game)
  return time ? `${date}\n${time}` : `${date}\nTBA`
}

const RESULT_CLASS = { W: 'w', L: 'l', T: 't' }

export default function Schedule({ team, games, conferenceIds }) {
  const program = CONFIG.TEAMS[team]
  return (
    <Section
      title={`The ${CONFIG.SEASON_LABEL} ${program.label.toLowerCase()} slate`}
      sub={`Home games at ${program.arena} carry the cardinal edge. All times Central.`}
    >
      <div className="slate">
        {games.map((game) => (
          <div
            key={game.id}
            className={`game${
              game.homeAway === 'home' && !game.neutralSite ? ' game--home' : ''
            }`}
          >
            <div className="game__when" style={{ whiteSpace: 'pre-line' }}>
              {when(game)}
            </div>
            <div className="game__opp">
              {game.them.logo && <img src={game.them.logo} alt="" loading="lazy" />}
              <div>
                <div className="game__name">
                  {vsAt(game)}{' '}
                  {game.them.rank && <span className="rankchip">#{game.them.rank} </span>}
                  {game.them.name}
                  {conferenceIds.has(game.them.id) && !game.note && (
                    <span className="tag">{program.conference}</span>
                  )}
                  {game.neutralSite && <span className="tag">Neutral</span>}
                  {CONFIG.RIVALRIES[game.them.id] && (
                    <span className="tag tag--trophy">{CONFIG.RIVALRIES[game.them.id]}</span>
                  )}
                </div>
                <div className="game__venue">
                  {game.note ||
                    (game.venue &&
                      [game.venue.name, game.venue.city].filter(Boolean).join(' · '))}
                </div>
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
          </div>
        ))}
      </div>
      <Sponsor slot={CONFIG.SCHEDULE_SPONSOR} placement="schedule" className="sponsorband" />
    </Section>
  )
}
