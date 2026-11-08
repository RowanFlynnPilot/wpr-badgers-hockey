import React, { useState } from 'react'
import { track } from '../analytics.js'

// One renderer for every sponsor slot (the object shape is documented in
// config.js). null/textless slots render nothing. `placement` keys the
// analytics event so each surface reports its own clicks. Three looks:
//   default — logo + the slot's text line (the Schedule band)
//   lockup  — the banner's white card, as on the Packers and Brewers
//             trackers: "Presented by", the logo, the tagline split at its
//             em-dash, Directions + "Plan your visit"
//   credit  — "Presented by" + the logo, for the mini cards' footers
// `linkless` forces a non-link even when href is set — the minis need it
// because the whole mini card is already an <a>. If a logo ever fails to
// load, the sponsor's name stands in: a paid slot never shows a broken image.
export default function Sponsor({ slot, placement, className, linkless, variant = 'default' }) {
  const [logoFailed, setLogoFailed] = useState(false)
  if (!slot || !slot.text) return null

  const showLogo = slot.logo && !logoFailed
  // Not lazy: sponsor art sits at the top of the banner and the minis, and
  // a paid placement shouldn't wait on scroll heuristics to appear.
  const logo = (alt) => <img src={slot.logo} alt={alt} onError={() => setLogoFailed(true)} />
  const linked = slot.href && !linkless
  const linkProps = {
    href: slot.href,
    target: '_blank',
    rel: 'noopener noreferrer sponsored',
    onClick: () => track('Sponsor Click', { placement }),
  }

  if (variant === 'credit') {
    return (
      <span className={className}>
        {showLogo ? (
          <>
            <span>Presented by</span>
            {logo(slot.name || '')}
          </>
        ) : (
          <span>{slot.text}</span>
        )}
      </span>
    )
  }

  if (variant === 'lockup') {
    const [offer, place] = (slot.tagline || '').split('—').map((s) => s.trim())
    // The card is already a link, so Directions is a button-role span
    // (nested anchors are invalid): Apple Maps on Apple hardware, Google
    // Maps everywhere else.
    const openDirections = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const q = encodeURIComponent(slot.address)
      const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
      track('Sponsor Click', { placement, action: 'directions' })
      window.open(
        apple
          ? `https://maps.apple.com/?daddr=${q}`
          : `https://www.google.com/maps/dir/?api=1&destination=${q}`,
        '_blank',
        'noopener',
      )
    }
    const Box = linked ? 'a' : 'div'
    return (
      <Box {...(linked ? linkProps : {})} className="sponsorlockup">
        <div className="sponsorlockup__eyebrow">Presented by</div>
        <div className="sponsorlockup__row">
          {showLogo ? (
            logo(slot.name || slot.text)
          ) : (
            <span className="sponsorlockup__name">{slot.name || slot.text}</span>
          )}
          {offer && (
            <div className="sponsorlockup__tagline">
              <div className="sponsorlockup__offer">{offer}</div>
              {place && <div className="sponsorlockup__place">{place}</div>}
            </div>
          )}
          <div className="sponsorlockup__actions">
            {slot.address && (
              <span
                role="button"
                tabIndex={0}
                className="sponsorlockup__directions"
                onClick={openDirections}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openDirections(e)
                }}
              >
                <svg width="10" height="13" viewBox="0 0 12 15" aria-hidden="true">
                  <path d="M6 0C2.9 0 .5 2.4.5 5.4c0 3.9 4.9 9 5.1 9.2a.55.55 0 0 0 .8 0c.2-.2 5.1-5.3 5.1-9.2C11.5 2.4 9.1 0 6 0zm0 7.6a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4z" />
                </svg>
                Directions
              </span>
            )}
            {linked && (
              <span className="sponsorlockup__cta">
                Plan your visit <span aria-hidden="true">→</span>
              </span>
            )}
          </div>
        </div>
      </Box>
    )
  }

  const inner = (
    <>
      {showLogo && logo('')}
      <span>{slot.text}</span>
    </>
  )
  if (linked) {
    return (
      <a className={className} {...linkProps}>
        {inner}
      </a>
    )
  }
  return <span className={className}>{inner}</span>
}
