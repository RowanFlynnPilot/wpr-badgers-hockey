import React from 'react'
import { CONFIG } from '../config.js'
import Sponsor from './Sponsor.jsx'

export default function BadgersBanner() {
  return (
    <div className="banner">
      {CONFIG.USE_TEAM_LOGO && <img className="banner__logo" src={CONFIG.TEAM_LOGO} alt="" />}
      <div>
        <div className="banner__kicker">{CONFIG.SEASON_LABEL} · Men's &amp; women's hockey</div>
        <h1 className="banner__title">Badgers hockey, by the numbers</h1>
      </div>
      <Sponsor slot={CONFIG.TITLE_SPONSOR} placement="banner" variant="lockup" />
    </div>
  )
}
