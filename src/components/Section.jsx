import React from 'react'

// Fail-soft sections OWN this chrome: on error/empty the heading disappears
// with the content — never render an orphaned title over blank space.
export default function Section({ title, sub, children }) {
  return (
    <section className="section">
      <h2 className="section__title">{title}</h2>
      {sub && <p className="section__sub">{sub}</p>}
      {children}
    </section>
  )
}
