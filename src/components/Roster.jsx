import React, { useEffect, useState } from 'react'
import { fetchRoster } from '../api.js'
import Section from './Section.jsx'

const isWisconsin = (player) => player.hometown.endsWith(', WI')

// `open` is state, not a bare attribute, so the 60s poll re-render can't
// force a group a reader closed back open.
function Group({ group, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        {group.side}
        <span className="count">{group.players.length} players</span>
      </summary>
      <div className="tablewrap">
        <table className="table">
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Player</th>
              <th>Ht / Wt</th>
              <th>Hometown</th>
            </tr>
          </thead>
          <tbody>
            {group.players.map((player) => (
              <tr key={player.id}>
                <td className="num">{player.jersey}</td>
                <td style={{ fontWeight: 600 }}>{player.name}</td>
                <td>
                  {player.height}
                  {player.weight && ` / ${player.weight}`}
                </td>
                <td className={isWisconsin(player) ? 'hometown--wi' : undefined}>
                  {player.hometown}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

// Men's only in practice: ESPN serves an empty women's roster, so this
// renders nothing there (the Team tab then shows the note in App.jsx).
// Keyed by team in App so switching programs refetches.
export default function Roster({ team, onEmpty }) {
  const [groups, setGroups] = useState(null)

  useEffect(() => {
    let alive = true
    fetchRoster(team)
      .then((g) => {
        if (!alive) return
        setGroups(g)
        if (!g.length && onEmpty) onEmpty()
      })
      .catch(() => {
        if (alive && onEmpty) onEmpty()
      })
    return () => {
      alive = false
    }
  }, [team])

  if (!groups || !groups.length) return null

  const wisconsinCount = groups.flatMap((g) => g.players).filter(isWisconsin).length

  return (
    <Section
      title="The roster"
      sub={`Tap a group to expand.${
        wisconsinCount
          ? ` ${wisconsinCount} player${wisconsinCount === 1 ? '' : 's'} call Wisconsin home — hometowns in cardinal.`
          : ''
      }`}
    >
      <div className="roster">
        {groups.map((group, i) => (
          <Group key={group.side} group={group} defaultOpen={i === 0} />
        ))}
      </div>
    </Section>
  )
}
