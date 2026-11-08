import React from 'react'
import { CONFIG } from '../config.js'
import { gameDate, gameTime, resultLine, vsAt } from '../format.js'
import { fmt, records } from '../record.js'
import Section from './Section.jsx'

const MINNESOTA = '135' // the Border Battle, in both programs

// Auto-written story cards from the same live feeds as the rest of the
// widget (schedule, poll, the other program's schedule) — never hand-
// maintained, so never stale. Every candidate is fail-soft (null skips it);
// the first four that resolve render, in priority order.
export default function Storylines({ team, schedule, poll, rec, other, onSwitch }) {
  const played = schedule.filter((g) => g.completed)
  const ranks = new Map(((poll && poll.ranks) || []).map((r) => [r.teamId, r.current]))
  const ctx = { team, schedule, played, poll, ranks, rec, other }

  // Three cards about this program, and the last slot for the other one.
  const side = meanwhile(ctx)
  const cards = [
    postseason(ctx),
    pollCard(ctx),
    played.length ? form(ctx) : opener(ctx),
    borderBattle(ctx),
    rankedTests(ctx),
    homeIce(ctx),
  ]
    .filter(Boolean)
    .slice(0, side ? 3 : 4)
  if (side) cards.push(side)
  if (!cards.length) return null

  return (
    <Section title="Storylines" sub={played.length ? 'The season so far, written from the live numbers.' : `Going into ${CONFIG.SEASON_LABEL}.`}>
      <div className="stories">
        {cards.map((card) => {
          const body = (
            <>
              <div className="story__tag">{card.tag}</div>
              {card.big && <div className="story__big">{card.big}</div>}
              <p className="story__text">{card.text}</p>
            </>
          )
          return card === side && onSwitch ? (
            <button type="button" className="story story--switch" key={card.tag} onClick={() => onSwitch(other.team)}>
              {body}
              <span className="story__go">See the {CONFIG.TEAMS[other.team].label.toLowerCase()} tracker →</span>
            </button>
          ) : (
            <div className="story" key={card.tag}>
              {body}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

const day = (g) => gameDate(g, { weekday: 'short', month: 'short', day: 'numeric' })
const opp = (g, ranks) => {
  const r = ranks.get(g.them.id) || g.them.rank
  return `${r ? `No. ${r} ` : ''}${g.them.short}`
}
const where = (g) =>
  g.neutralSite && g.venue ? `at ${g.venue.name}` : g.homeAway === 'home' ? 'at home' : 'on the road'
const upcoming = (schedule) => schedule.filter((g) => g.state === 'pre')

// ------------------------------------------------------------------ cards

function postseason({ schedule, played }) {
  const post = schedule.filter((g) => g.postseason)
  if (!post.length) return null
  const last = [...post].reverse().find((g) => g.completed)
  const next = post.find((g) => g.state !== 'post')
  if (next)
    return {
      tag: 'Postseason',
      big: next.note || 'Playoffs',
      text: `Next: ${vsAt(next)} ${next.them.short}, ${day(next)}${
        gameTime(next) ? `, ${gameTime(next)} ${CONFIG.TIMEZONE_LABEL}` : ''
      }.${last ? ` Last time out: ${resultLine(last)} vs ${last.them.short}.` : ''}`,
    }
  if (last && last === played[played.length - 1])
    return {
      tag: 'Postseason',
      big: resultLine(last),
      text: `${last.note || 'The postseason'}: ${vsAt(last)} ${last.them.short} on ${day(last)}.`,
    }
  return null
}

function pollCard({ poll, ranks }) {
  const mine = poll && poll.ranks.find((r) => r.teamId === CONFIG.TEAM_ID)
  if (!mine) return null
  const prev = mine.previous
  const move = !prev
    ? 'new to the poll this week'
    : prev === mine.current
      ? 'holding its spot from last week'
      : prev > mine.current
        ? `up ${prev - mine.current} from No. ${prev} last week`
        : `down ${mine.current - prev} from No. ${prev} last week`
  const above = mine.current === 1 ? '' : ` Chasing ${poll.ranks.find((r) => r.current === 1).name} at No. 1.`
  return {
    tag: 'The poll',
    big: `No. ${mine.current}`,
    text: `Wisconsin is No. ${mine.current} in the USCHO poll${poll.week ? ` (${poll.week})` : ''}, ${move}.${above}`,
  }
}

function form({ played, rec }) {
  const losses = played.filter((g) => g.result === 'L').length
  const shutouts = played.filter((g) => g.them.score === 0).length
  const gf = played.reduce((s, g) => s + g.us.score, 0)
  const ga = played.reduce((s, g) => s + g.them.score, 0)
  const scoring = `Outscoring opponents ${gf}–${ga}${
    shutouts ? `, with ${shutouts} shutout${shutouts === 1 ? '' : 's'}` : ''
  }.`
  if (!losses)
    return {
      tag: 'Unbeaten',
      big: fmt(rec.overall),
      text: `${played.length} games, no losses yet. ${scoring}`,
    }
  const last5 = records(played.slice(-5), null).overall
  const n = Number(rec.streak.slice(1))
  const kind = { W: 'win', L: 'loss', T: 'tie' }[rec.streak[0]]
  return {
    tag: 'Form',
    big: `${fmt(last5)} in the last ${Math.min(5, played.length)}`,
    text: `${n > 1 ? `On a ${n}-game ${kind === 'win' ? 'winning' : kind === 'loss' ? 'losing' : 'tie'} streak. ` : ''}${scoring}`,
  }
}

function opener({ schedule }) {
  const first = schedule[0]
  if (!first || first.state !== 'pre') return null
  const time = gameTime(first)
  return {
    tag: 'Opening night',
    big: day(first),
    text: `Wisconsin opens ${vsAt(first)} ${first.them.short} ${where(first)}${
      time ? `, ${time} ${CONFIG.TIMEZONE_LABEL}` : ''
    }${first.tv ? ` on ${first.tv}` : ''}.`,
  }
}

function borderBattle({ schedule }) {
  const games = schedule.filter((g) => g.them.id === MINNESOTA)
  if (!games.length) return null
  const done = games.filter((g) => g.completed)
  const next = games.find((g) => g.state !== 'post')
  const tally = fmt(records(done, null).overall)
  const lastDone = done[done.length - 1]
  const sofar = done.length
    ? `Wisconsin is ${tally} against the Gophers this season (last: ${resultLine(lastDone)}).`
    : `${games.length} meetings with the Gophers this season.`
  if (!next && !done.length) return null
  return {
    tag: 'Border Battle',
    big: done.length ? tally : `${games.length} games`,
    text: `${sofar}${next ? ` Next: ${day(next)}, ${where(next)}.` : ' The season series is done.'}`,
  }
}

function rankedTests({ schedule, ranks }) {
  const ahead = upcoming(schedule)
  const ranked = ahead.filter((g) => ranks.has(g.them.id))
  if (!ranked.length) return null
  const next = ranked[0]
  return {
    tag: 'Ranked tests',
    big: `${ranked.length} of ${ahead.length}`,
    text: `${ranked.length} of the ${ahead.length} games left come against teams in this week's poll. Next: ${opp(
      next,
      ranks,
    )}, ${day(next)}, ${where(next)}.`,
  }
}

function homeIce({ team, schedule, rec }) {
  const arena = CONFIG.TEAMS[team].arena
  const home = upcoming(schedule).filter((g) => g.homeAway === 'home' && !g.neutralSite)
  if (!home.length) return null
  const homePlayed = rec.home.w + rec.home.l + rec.home.t
  return {
    tag: 'Home ice',
    big: `${home.length} dates left`,
    text: `${homePlayed ? `${fmt(rec.home)} at ${arena} so far. ` : ''}Next home game: ${home[0].them.short}, ${day(
      home[0],
    )}.`,
  }
}

// The other program, one card — the toggle is easy to miss.
function meanwhile({ other }) {
  if (!other || !other.schedule) return null
  const label = CONFIG.TEAMS[other.team].label.toLowerCase()
  const rank = other.poll && (other.poll.ranks.find((r) => r.teamId === CONFIG.TEAM_ID) || {}).current
  const rec = records(other.schedule, null)
  const live = other.schedule.find((g) => g.state === 'in')
  const next = other.schedule.find((g) => g.state === 'pre')
  const status = live
    ? `Live now: ${live.us.score}–${live.them.score} ${vsAt(live)} ${live.them.short}.`
    : next
      ? `Next: ${vsAt(next)} ${next.them.short}, ${day(next)}.`
      : ''
  return {
    tag: `Meanwhile, the ${label}`,
    big: rank ? `No. ${rank}` : rec.played ? fmt(rec.overall) : null,
    text: `${rec.played ? `The ${label} team is ${fmt(rec.overall)}${rank ? ` and No. ${rank} in the USCHO poll` : ''}. ` : ''}${status}`,
  }
}
