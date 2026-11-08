// Opt-in, cookieless Plausible. No external script loads unless
// ANALYTICS.domain is set in config.js. Analytics only — this is NOT the
// forbidden data scraper/cache.
import { CONFIG } from './config.js'

let loaded = false

export function initAnalytics() {
  if (!CONFIG.ANALYTICS.domain || loaded) return
  const script = document.createElement('script')
  script.defer = true
  script.src = CONFIG.ANALYTICS.src
  script.dataset.domain = CONFIG.ANALYTICS.domain
  document.head.appendChild(script)
  loaded = true
}

export function track(name, props) {
  if (window.plausible) window.plausible(name, props ? { props } : undefined)
}
