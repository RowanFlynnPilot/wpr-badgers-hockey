// Prints the sales one-pager (one-pager.html) to a Letter PDF with live
// numbers and a QR code to the hosted media kit. Run after a build:
//   npm run one-pager            → docs/badgers-hockey-sponsorship.pdf
// Rerun whenever Chris wants a fresh copy — rankings/records are as of the
// moment it's printed (the sheet says so).
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { preview } from 'vite'
import { chromium } from 'playwright'
import QRCode from 'qrcode'

const OUT = fileURLToPath(new URL('../docs/badgers-hockey-sponsorship.pdf', import.meta.url))
const KIT = 'https://rowanflynnpilot.github.io/wpr-badgers-hockey/sponsors.html'
mkdirSync(fileURLToPath(new URL('../docs/', import.meta.url)), { recursive: true })

const server = await preview({ preview: { port: 4174, strictPort: false, host: '127.0.0.1' } })
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 816, height: 1056 },
    locale: 'en-US',
    timezoneId: 'America/Chicago',
    // ESPN 403s headless browsers via the UA AND the sec-ch-ua client hint
    // (see wpr-badgers-tracker's render-digest.mjs) — mask both.
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
  })
  await page.setExtraHTTPHeaders({ 'sec-ch-ua': '"Chromium";v="149", "Not)A;Brand";v="24"' })
  await page.goto(`${base}one-pager.html`, { waitUntil: 'load', timeout: 60000 })
  // Fail loudly rather than print a sheet with dashes for numbers.
  await page.waitForSelector('.op[data-ready="true"]', { timeout: 60000 })

  const svg = await QRCode.toString(KIT, { type: 'svg', margin: 0, color: { dark: '#1F1A17', light: '#0000' } })
  await page.evaluate((markup) => {
    document.getElementById('op-qr').innerHTML = markup
  }, svg)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)

  // Guard: the sheet must fit one page.
  const overflow = await page.evaluate(() => {
    const op = document.querySelector('.op')
    return op.scrollHeight - op.clientHeight
  })
  if (overflow > 0) throw new Error(`One-pager overflows its page by ${overflow}px`)

  await page.pdf({ path: OUT, format: 'Letter', printBackground: true, preferCSSPageSize: true })
  console.log(`Wrote ${OUT}`)
} finally {
  await browser.close()
  server.httpServer.close()
}
