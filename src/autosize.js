// When embedded, post document height to the host on every layout change so
// the iframe always fits the active tab (no fixed height / inner scroll).
// The host listens for { type: 'wpr-badgers-height' } — snippet in README.
// No-op when standalone.
//
// offsetHeight, NOT scrollHeight: the root's scrollHeight floors at the
// viewport (= current iframe height), so the frame could grow but never
// shrink back when switching from a tall tab to a short one.
export function initAutosize() {
  if (window.parent === window) return
  const post = () =>
    window.parent.postMessage(
      { type: 'wpr-badgers-height', height: document.documentElement.offsetHeight },
      '*',
    )
  new ResizeObserver(post).observe(document.documentElement)
  window.addEventListener('load', post)
  // embed.js (the host-side listener) pings this when it attaches, in case
  // the widget loaded and posted before it — a fast iframe can beat the
  // async <script src> the snippets use. Height is already broadcast to
  // any parent, so answering the ping leaks nothing new.
  window.addEventListener('message', (e) => {
    if (e.data === 'wpr-badgers-height?') post()
  })
}
