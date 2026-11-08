import React from 'react'

export function Loading() {
  return <div className="loading">Warming up the numbers…</div>
}

export function ErrorState({ message }) {
  return (
    <div className="errorstate">
      Couldn't reach the stats feed. Refresh to try again.
      <div style={{ fontSize: 11, marginTop: 6, fontFamily: 'var(--mono)' }}>
        {message}
      </div>
    </div>
  )
}
