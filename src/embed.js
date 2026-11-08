// Shared by the mini embeds: the `?to=` param overrides where a tap lands
// (http/https only), otherwise the default destination is used.
export function destination(fallback) {
  const to = new URLSearchParams(window.location.search).get('to')
  if (to && /^https?:\/\//i.test(to)) return to
  return fallback
}
