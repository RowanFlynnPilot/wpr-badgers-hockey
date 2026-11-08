// Generates public/og.png — the 1200×630 social share card (og:image /
// twitter:image) referenced from index.html. One-time committed asset;
// rerun after a branding change:  node scripts/og-card.mjs
// Uses the same headless Chromium that renders the newsletter digest.
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const OUT = fileURLToPath(new URL('../public/og.png', import.meta.url))
mkdirSync(dirname(OUT), { recursive: true })

// Mirrors the widget's masthead → cardinal banner → bleacher stripe stack.
const html = `<!doctype html>
<html><head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Public+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #F6F2E9; color: #1F1A17;
         font-family: 'Public Sans', sans-serif; padding: 52px 72px 0; }
  .masthead { display: flex; justify-content: space-between; align-items: baseline;
              border-bottom: 4px solid #1F1A17; padding-bottom: 14px; }
  .masthead h1 { font-family: Fraunces, serif; font-weight: 900; font-size: 40px;
                 letter-spacing: -0.01em; }
  .masthead span { font-size: 20px; color: rgba(31, 26, 23, 0.62); }
  .banner { background: #C5050C; color: #fff; margin-top: 34px; padding: 40px 44px 44px; }
  .kicker { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700;
            letter-spacing: 0.18em; opacity: 0.88; }
  .title { font-family: Fraunces, serif; font-weight: 900; font-size: 88px;
           line-height: 1.04; margin-top: 14px; }
  .stripe { height: 16px;
            background: repeating-linear-gradient(90deg, #C5050C 0 26px, #fff 26px 52px);
            border: 1px solid rgba(31, 26, 23, 0.14); border-top: 0; }
  .foot { margin-top: 40px; display: flex; justify-content: space-between;
          align-items: baseline; }
  .features { font-size: 26px; font-weight: 600; color: rgba(31, 26, 23, 0.78); }
  .url { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700;
         color: #C5050C; }
</style></head>
<body>
  <div class="masthead">
    <h1>Wausau Pilot &amp; Review</h1>
    <span>Where Locals Look First For News</span>
  </div>
  <div class="banner">
    <div class="kicker">2026–27 · MEN'S &amp; WOMEN'S HOCKEY · LIVE FROM ESPN</div>
    <div class="title">Badgers hockey,<br>by the numbers</div>
  </div>
  <div class="stripe"></div>
  <div class="foot">
    <span class="features">Live scores · Schedules · USCHO polls · Records</span>
    <span class="url">wausaupilotandreview.com</span>
  </div>
</body></html>`

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: OUT })
  console.log(`Wrote ${OUT}`)
} finally {
  await browser.close()
}
