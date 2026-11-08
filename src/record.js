// Wisconsin's records, computed from its own results. ESPN's hockey
// standings have no conference record (see api.js), so the conference line
// is derived here: games vs conference members that aren't tournament games
// (a `note` marks conference playoffs / NCAA games, which don't count).

const tally = (games) => {
  const n = (r) => games.filter((g) => g.result === r).length
  return { w: n('W'), l: n('L'), t: n('T') }
}

export const fmt = ({ w, l, t }) => `${w}–${l}–${t}`

export function records(schedule, conferenceIds) {
  const played = schedule.filter((g) => g.completed)
  const conf = conferenceIds
    ? played.filter((g) => conferenceIds.has(g.them.id) && !g.note)
    : []
  const home = played.filter((g) => g.homeAway === 'home' && !g.neutralSite)
  const away = played.filter((g) => g.homeAway === 'away' && !g.neutralSite)

  // Current streak: consecutive identical results from the latest game back.
  let streak = null
  if (played.length) {
    const last = played[played.length - 1].result
    let n = 0
    for (let i = played.length - 1; i >= 0 && played[i].result === last; i--) n++
    streak = `${last}${n}`
  }

  const goalsFor = played.reduce((s, g) => s + g.us.score, 0)
  const goalsAgainst = played.reduce((s, g) => s + g.them.score, 0)
  return {
    played: played.length,
    overall: tally(played),
    conf: conferenceIds ? tally(conf) : null,
    confPlayed: conf.length,
    home: tally(home),
    away: tally(away),
    streak,
    gfPerGame: played.length ? goalsFor / played.length : 0,
    gaPerGame: played.length ? goalsAgainst / played.length : 0,
  }
}
