// Shared formatting so every live-derived factor explains its own up/down
// move the same way, instead of each service re-deriving its own thresholds.
export function fmtPct(pct) {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

export function direction(pct, labels) {
  if (pct > 0.3) return labels.up
  if (pct < -0.3) return labels.down
  return labels.flat
}
