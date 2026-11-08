import { useState } from 'react'
import { CONFIG } from './config.js'
import { track } from './analytics.js'

// mailto: with a safety net. Plenty of desks have no mail-app handler, so a
// mailto click can look like nothing happened — every inquiry click ALSO
// copies the address, and the caller shows a "copied" confirmation, so the
// prospect always walks away holding it. The mailto still opens the compose
// sheet wherever one exists, and the Sponsor Inquiry event fires either way.
export function useInquiry(slot) {
  const [copied, setCopied] = useState(false)
  const onClick = () => {
    track('Sponsor Inquiry', { slot })
    try {
      navigator.clipboard
        .writeText(CONFIG.SPONSOR_INQUIRY)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 4000)
        })
        .catch(() => {})
    } catch {
      /* no clipboard access — the mailto is still doing its best */
    }
  }
  return { onClick, copied }
}
