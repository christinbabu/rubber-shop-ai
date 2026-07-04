import type { Factor } from './marketFactors'

// ─── Seasonal model ────────────────────────────────────────────────────────
// Indian natural rubber (Kottayam RSS4) has one dominant annual cycle driven by
// the SW monsoon: tapping in Kerala/Karnataka is disrupted June–September
// (peak disruption mid-August), which tightens supply and firms prices. After
// the monsoon retreats, tapping resumes and the post-harvest supply build
// (Oct–Dec) typically softens price into the year-end. We model this as a
// single annual cosine wave peaking mid-August — deterministic and reproducible,
// not a per-day random walk.
const SEASONAL_AMPLITUDE_PCT = 5.5   // peak/trough swing vs. the annual mean

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.floor((date.getTime() - start.getTime()) / 86400000) + 1
}

function yearLength(year: number): number {
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365
}

export function seasonalPct(date: Date): number {
  const peakDate = new Date(date.getFullYear(), 7, 15) // Aug 15 — historical peak disruption
  const peakDoy  = dayOfYear(peakDate)
  const doy      = dayOfYear(date)
  const len      = yearLength(date.getFullYear())
  return SEASONAL_AMPLITUDE_PCT * Math.cos((2 * Math.PI * (doy - peakDoy)) / len)
}

// ─── Fundamentals drift ─────────────────────────────────────────────────────
// The other 6 model factors (monsoon is covered by the seasonal wave above) are
// expressed as a deviation from their own midpoint, weighted by the factor's
// existing model weight, capped at a combined ceiling. All factors use the same
// "higher value = more bullish" convention as the Market Forecast model.
const MAX_FUNDAMENTAL_DRIFT_PCT = 15

export function fundamentalDriftPct(factors: Factor[]): number {
  return factors
    .filter((f) => f.id !== 'monsoon')
    .reduce((sum, f) => {
      const mid = (f.min + f.max) / 2
      const halfRange = (f.max - f.min) / 2
      const normDev = halfRange === 0 ? 0 : (f.val - mid) / halfRange   // -1..1
      return sum + f.weight * normDev * MAX_FUNDAMENTAL_DRIFT_PCT
    }, 0)
}

// ─── Daily price model ──────────────────────────────────────────────────────

export type DayPrediction = {
  date: Date
  dateKey: string          // YYYY-MM-DD
  dayOfWeek: number
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  actualPrice: number | null    // real recorded price for this date, if any
  predictedPrice: number
  lo: number
  hi: number
  confidence: number
  signal: 'BUY' | 'SELL' | 'HOLD'
  deltaVsSpotPct: number
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SIGNAL_THRESHOLD_PCT = 0.7

export function buildMonthPredictions(
  year: number,
  monthIndex0: number,       // 0-11
  spotPrice: number,
  spotDate: Date,
  factors: Factor[],
  actualsByDate: Record<string, number>,
): DayPrediction[] {
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate()
  const todayKey    = toDateKey(spotDate)
  const spotSeasonal = seasonalPct(spotDate)
  const drift        = fundamentalDriftPct(factors)

  const days: DayPrediction[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex0, day)
    const dateKey = toDateKey(date)
    const t = Math.round((date.getTime() - spotDate.getTime()) / 86400000) // days from spot date

    const seasonalDeltaPct = seasonalPct(date) - spotSeasonal
    const fadeIn = Math.min(1, Math.abs(t) / 45)
    const totalDeltaPct = seasonalDeltaPct + drift * fadeIn

    const predictedPrice = spotPrice > 0 ? Math.round(spotPrice * (1 + totalDeltaPct / 100)) : 0
    const spread = Math.round(predictedPrice * 0.03)
    const confidence = Math.max(35, Math.min(92, Math.round(90 - Math.abs(t) * 1.3)))

    const signal: DayPrediction['signal'] =
      totalDeltaPct >= SIGNAL_THRESHOLD_PCT ? 'SELL' :
      totalDeltaPct <= -SIGNAL_THRESHOLD_PCT ? 'BUY' : 'HOLD'

    days.push({
      date,
      dateKey,
      dayOfWeek: date.getDay(),
      isToday: dateKey === todayKey,
      isPast: date < new Date(spotDate.getFullYear(), spotDate.getMonth(), spotDate.getDate()),
      isFuture: date > new Date(spotDate.getFullYear(), spotDate.getMonth(), spotDate.getDate()),
      actualPrice: actualsByDate[dateKey] ?? (dateKey === todayKey ? spotPrice : null),
      predictedPrice,
      lo: predictedPrice - spread,
      hi: predictedPrice + spread,
      confidence,
      signal,
      deltaVsSpotPct: Math.round(totalDeltaPct * 10) / 10,
    })
  }
  return days
}
