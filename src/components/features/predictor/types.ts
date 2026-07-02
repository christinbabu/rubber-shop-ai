export type TabId =
  | 'daily'
  | 'forecast'
  | 'karnataka'
  | 'yearanalysis'
  | 'dashboard'
  | 'predictor'
  | 'analysis'

export type MarketBase = {
  label: string
  base: number
  grade: string
}

export type LiveMarket = MarketBase & {
  id: string
  price: number
  prev: number
  spark: { v: number }[]
  change: number
  pct: number
}

export type KarnatakaMarket = {
  id: string
  name: string
  role: string
  base: number
  rss4: number
  rss3: number
  rss5: number
  lot: number
  si: number
  desc: string
}

export type KarnatakaHistoryPoint = {
  m: string
  ujire: number
  kottayam: number
}

export type Factor = {
  id: string
  label: string
  min: number
  max: number
  val: number
  unit: string
  weight: number
  icon: string
  step?: number
}

export type Momentum = 'bullish' | 'bearish' | 'neutral'

export type ForecastPoint = {
  month: string
  pred: number
  lo: number
  hi: number
  bull: number
  bear: number
  season: string
  momentum: Momentum
  confidence: number
  catalyst: string
  risk: string
  crude: number
  inr: number
  chinaIdx: number
  supply: string
}

export type YearEntry = {
  m: string
  price: number
}

export type YearEntry2026 = YearEntry & {
  type: 'actual' | 'forecast'
  lo?: number
  hi?: number
}

export type YearDriver = {
  label: string
  detail: string
  icon: string
  dir: 'up' | 'dn' | 'neu'
}

export type YearEvent = {
  m: string
  event: string
  price: number
}

export type YearAnalysis = {
  avg: number
  high: number
  highM: string
  low: number
  lowM: string
  change: string
  headline: string
  color: string
  summary: string
  drivers: YearDriver[]
  events: YearEvent[]
}

export type DailyPoint = {
  date: string
  price: number
  lo: number
  hi: number
  conf: number
  vol: number
  signal: 'BUY' | 'SELL' | 'HOLD'
  isToday: boolean
  dow: string
  day: number
}

export type NewsItem = {
  time: string
  tag: string
  text: string
  icon: string
}

export type TagColor = {
  bg: string
  text: string
  border: string
}

export type PredictionResult = {
  pred: number
  lo: number
  hi: number
  base: number
  contribs: { name: string; val: number }[]
}

export type AiOutputLine = {
  text: string
  type: 'info' | 'data' | 'warning' | 'result' | 'success'
}
