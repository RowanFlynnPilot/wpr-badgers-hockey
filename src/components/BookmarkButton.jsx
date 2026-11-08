import React, { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../config.js'
import { track } from '../analytics.js'

// No browser exposes a programmatic add-bookmark API, so this shows the
// OS-correct shortcut (which, in the iframe, bookmarks the host WPR page)
// plus a phone-friendly copy-link to the canonical WPR Badgers page.
export default function BookmarkButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  // Cross-origin iframes block the clipboard API unless the host <iframe>
  // delegates it (allow="clipboard-write" — in the README snippet). When it
  // still fails, fall back to a select-and-copy field.
  const [manual, setManual] = useState(false)
  const wrap = useRef(null)
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  // Standard popover manners: tap outside or Escape closes it.
  useEffect(() => {
    if (!open) return
    const onPointer = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) track('Bookmark')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONFIG.CANONICAL_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setManual(true)
    }
    track('Bookmark', { action: 'copy' })
  }

  return (
    <div className="bookmark" ref={wrap}>
      <button className="chipbtn" onClick={toggle} aria-expanded={open}>
        ☆ Bookmark
      </button>
      {open && (
        <div className="bookmark__pop">
          <div>
            Press <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd>D</kbd> to bookmark
            this page, or grab the link:
          </div>
          {manual ? (
            <input
              className="bookmark__url"
              readOnly
              value={CONFIG.CANONICAL_URL}
              onFocus={(e) => e.target.select()}
              aria-label="Link to the Badgers page — select and copy"
            />
          ) : (
            <button className="bookmark__copy" onClick={copy}>
              {copied ? 'Copied ✓' : 'Copy link'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
