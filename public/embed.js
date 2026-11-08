// Host-side autosize for the WPR Badgers embeds. Loaded from THIS origin by
// the embed snippets (<script src=".../embed.js">) instead of pasted inline:
// WPR's WordPress refuses to save post content containing inline <script>
// code — the security layer blocks the save request and the editor shows
// "Updating failed. The response is not a valid JSON response." A script-
// free snippet also survives editors that strip inline JS. One include
// handles every tracker iframe on the page; extra includes no-op.
//
// Security matches the old inline snippets: only messages from the origin
// this file was served from are honored (derived from the script's own src,
// so localhost previews work too), and the sender must be one of the page's
// own iframes — so multiple widgets coexist and nothing can spoof a resize.
(function () {
  if (window.wprBadgersEmbed) return
  window.wprBadgersEmbed = 1
  var origin = new URL(document.currentScript.src).origin
  window.addEventListener('message', function (e) {
    if (e.origin !== origin) return
    if (!e.data || e.data.type !== 'wpr-badgers-height') return
    // A widget is never legitimately 0px — a zero can arrive from the very
    // first pre-render measurement; keep the placeholder height instead of
    // collapsing the frame.
    if (!(e.data.height > 0)) return
    var frames = document.getElementsByTagName('iframe')
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === e.source) {
        frames[i].style.height = e.data.height + 'px'
        return
      }
    }
  })
  // The widgets self-announce on load and on layout changes, but a fast
  // iframe can finish before this (async) script attaches its listener —
  // ping the frames so already-loaded widgets re-post. targetOrigin scopes
  // the ping to tracker frames; anything else on the page never sees it.
  var ping = function () {
    var frames = document.getElementsByTagName('iframe')
    for (var i = 0; i < frames.length; i++) {
      try {
        frames[i].contentWindow.postMessage('wpr-badgers-height?', origin)
      } catch (err) {}
    }
  }
  ping()
  window.addEventListener('load', ping)
})()
