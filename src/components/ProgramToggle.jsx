import React from 'react'
import { CONFIG } from '../config.js'

// Men's / Women's — a two-option radio group styled as a segmented control
// (it switches the whole tracker's data, so it sits above the section tabs
// rather than among them). Arrow keys move between the options natively.
export default function ProgramToggle({ team, onSelect }) {
  return (
    <div className="programs" role="radiogroup" aria-label="Program">
      {Object.entries(CONFIG.TEAMS).map(([key, program]) => (
        <label key={key} className={`program${team === key ? ' is-active' : ''}`}>
          <input
            type="radio"
            name="program"
            value={key}
            checked={team === key}
            onChange={() => onSelect(key)}
          />
          {program.label}
        </label>
      ))}
    </div>
  )
}
