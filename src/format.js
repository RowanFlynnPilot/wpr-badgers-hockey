// Single owner of game date/time and status display rules.
//
// ESPN convention for unannounced start times: the event is stamped
// midnight EASTERN on the true game date with `timeValid: false`.
// Formatting that in Central shifts the game to the previous day — so TBA
// games format their DATE in Eastern and show no time.
import { CONFIG } from './config.js'

const EASTERN = 'America/New_York'

export function gameDate(game, options) {
  return game.date.toLocaleDateString('en-US', {
    ...options,
    timeZone: game.timeValid ? CONFIG.TIMEZONE : EASTERN,
  })
}

// e.g. "7:00 PM" — or null when the puck-drop time isn't announced.
export function gameTime(game) {
  if (!game.timeValid) return null
  return game.date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: CONFIG.TIMEZONE,
  })
}

// Hockey periods: 1–3 → 1st/2nd/3rd, 4 → OT, 5 → 2OT…
export function periodLabel(period) {
  if (period <= 3) return ['1st', '2nd', '3rd'][period - 1] || ''
  return period === 4 ? 'OT' : `${period - 3}OT`
}

// In-game status line: "2nd 12:41", or "End 2nd" during an intermission.
export function liveLabel(game) {
  if (game.intermission) return `End ${periodLabel(game.period)}`
  return `${periodLabel(game.period)} ${game.displayClock}`
}

// "W 4–2", "L 2–3 OT", "T 1–1 OT"
export function resultLine(game) {
  return `${game.result} ${game.us.score}–${game.them.score}${game.overtime ? ' OT' : ''}`
}

export const vsAt = (game) => (game.homeAway === 'home' || game.neutralSite ? 'vs' : 'at')

// "Frozen Tundra Faceoff · Lambeau Field · Green Bay" — the event name (if
// any) never replaces the venue: a named game is usually somewhere unusual.
export function whereLine(game) {
  return [game.note, game.venue && game.venue.name, game.venue && game.venue.city]
    .filter(Boolean)
    .join(' · ')
}
