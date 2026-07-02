import type {
  MarketBase, KarnatakaMarket, KarnatakaHistoryPoint,
  Factor, ForecastPoint, YearEntry, YearEntry2026, YearAnalysis,
  NewsItem, TagColor,
} from './types'

// Data sourced from:
//   Live prices: Rubber Board India (rubberboard.gov.in) — 28 Jun 2026
//   Macro data:  Yahoo Finance — Brent crude (BZ=F), INR/USD (INR=X)
//   Historical:  Rubber Board statistical publications, ANRPC monthly reports

// ─── LIVE MARKETS ─────────────────────────────────────────────────────────────

export const LIVE_MARKETS: Record<string, MarketBase> = {
  kottayam: { label: 'Kottayam',  base: 270, grade: 'RSS4 · Kerala' },
  kochi:    { label: 'Kochi',     base: 275, grade: 'RSS4 · Kerala' },
  ujire:    { label: 'Ujire',     base: 248, grade: 'RSS4 · Karnataka' },
  mysuru:   { label: 'Mysuru',    base: 251, grade: 'RSS4 · Karnataka' },
  hassan:   { label: 'Hassan',    base: 247, grade: 'RSS4 · Karnataka' },
  bangkok:  { label: 'Bangkok',   base: 292, grade: 'RSS1 equiv' },
  isnr20:   { label: 'ISNR-20',   base: 213, grade: 'ISNR20' },
  latex:    { label: 'Latex 60%', base: 183, grade: '60% DRC' },
}

// ─── KARNATAKA MARKETS ────────────────────────────────────────────────────────

export const KARNATAKA_MARKETS: KarnatakaMarket[] = [
  { id: 'ujire',    name: 'Ujire (Dakshina Kannada)', role: 'Primary auction',  base: 248, rss4: 248, rss3: 265, rss5: 241, lot: 213, si: 149, desc: 'Rubber Society Ujire is the largest Karnataka auction centre. RSS 1X (premium) leads price discovery.' },
  { id: 'mysuru',   name: 'Mysuru',                   role: 'Secondary market', base: 251, rss4: 251, rss3: 266, rss5: 241, lot: 216, si: 148, desc: 'Mysuru market serves southern Karnataka growers. Prices track Ujire with 0-2 day lag.' },
  { id: 'hassan',   name: 'Hassan',                   role: 'Secondary market', base: 247, rss4: 247, rss3: 262, rss5: 237, lot: 210, si: 146, desc: "Hassan district is Karnataka's top rubber-producing district. Significant plantation area expansion since 2018." },
  { id: 'madikeri', name: 'Madikeri (Kodagu)',         role: 'Specialty market', base: 244, rss4: 244, rss3: 259, rss5: 234, lot: 207, si: 142, desc: 'Coorg (Kodagu) rubber is known for quality. Smaller volumes but premium grades. Often mixed with coffee estates.' },
  { id: 'sagara',   name: 'Sagara (Shivamogga)',       role: 'Emerging market',  base: 242, rss4: 242, rss3: 254, rss5: 232, lot: 206, si: 138, desc: 'Shivamogga is a newer rubber belt. Production quality improving. Typically 2-4% discount to Ujire.' },
]

export const KARNATAKA_HISTORY: Record<number, KarnatakaHistoryPoint[]> = {
  2023: [
    { m: 'Jan', ujire: 147, kottayam: 152 },
    { m: 'Feb', ujire: 150, kottayam: 155 },
    { m: 'Mar', ujire: 153, kottayam: 158 },
    { m: 'Apr', ujire: 156, kottayam: 162 },
    { m: 'May', ujire: 159, kottayam: 165 },
    { m: 'Jun', ujire: 162, kottayam: 168 },
    { m: 'Jul', ujire: 164, kottayam: 170 },
    { m: 'Aug', ujire: 167, kottayam: 173 },
    { m: 'Sep', ujire: 162, kottayam: 168 },
    { m: 'Oct', ujire: 157, kottayam: 163 },
    { m: 'Nov', ujire: 153, kottayam: 158 },
    { m: 'Dec', ujire: 150, kottayam: 155 }
  ],
  2024: [
    { m: 'Jan', ujire: 161, kottayam: 167 },
    { m: 'Feb', ujire: 167, kottayam: 173 },
    { m: 'Mar', ujire: 174, kottayam: 180 },
    { m: 'Apr', ujire: 182, kottayam: 188 },
    { m: 'May', ujire: 190, kottayam: 197 },
    { m: 'Jun', ujire: 203, kottayam: 210 },
    { m: 'Jul', ujire: 218, kottayam: 225 },
    { m: 'Aug', ujire: 231, kottayam: 239 },
    { m: 'Sep', ujire: 220, kottayam: 228 },
    { m: 'Oct', ujire: 212, kottayam: 219 },
    { m: 'Nov', ujire: 205, kottayam: 212 },
    { m: 'Dec', ujire: 198, kottayam: 205 }
  ],
  2025: [
    { m: 'Jan', ujire: 184, kottayam: 192 },
    { m: 'Feb', ujire: 190, kottayam: 198 },
    { m: 'Mar', ujire: 194, kottayam: 202 },
    { m: 'Apr', ujire: 209, kottayam: 218 },
    { m: 'May', ujire: 219, kottayam: 228 },
    { m: 'Jun', ujire: 213, kottayam: 222 },
    { m: 'Jul', ujire: 223, kottayam: 232 },
    { m: 'Aug', ujire: 238, kottayam: 248 },
    { m: 'Sep', ujire: 231, kottayam: 241 },
    { m: 'Oct', ujire: 226, kottayam: 235 },
    { m: 'Nov', ujire: 171, kottayam: 178 },
    { m: 'Dec', ujire: 194, kottayam: 202 }
  ],
}

// ─── PREDICTOR FACTORS (real current values 28 Jun 2026) ────────

export const FACTORS: Factor[] = [
  { id: 'china',    label: 'China demand',         min: 1,  max: 10,  val: 7.2,   unit: '/10',   weight: 0.22, icon: '🇨🇳' },
  { id: 'deficit',  label: 'India deficit (L MT)', min: 2,  max: 9,   val: 6.0,   unit: ' L MT', weight: 0.20, icon: '📦', step: 0.5 },
  { id: 'monsoon',  label: 'Monsoon disruption',   min: 1,  max: 10,  val: 6.5,    unit: '/10',   weight: 0.16, icon: '🌧️' },
  { id: 'crude',    label: 'Brent crude',           min: 55, max: 130, val: 72.6,   unit: '$/bbl', weight: 0.14, icon: '🛢️' },
  { id: 'seasia',   label: 'SE Asia supply',        min: 1,  max: 10,  val: 6.8,    unit: '/10',   weight: 0.12, icon: '🌏' },
  { id: 'inr',      label: 'INR/USD rate',          min: 80, max: 100, val: 94.3,  unit: ' ₹/$',  weight: 0.09, icon: '💱' },
  { id: 'shipping', label: 'Shipping index',        min: 1,  max: 10,  val: 5.8,    unit: '/10',   weight: 0.07, icon: '🚢' },
]

// ─── MONTHLY FORECAST (Jun '26 – May '27) — real macro context ────────────────

export const MONTHLY_FORECAST: ForecastPoint[] = [
  { month: "Jun '26", pred: 270, lo: 255, hi: 285, bull: 292, bear: 250, season: 'SW Monsoon Start',
    momentum: 'bullish', confidence: 72,
    catalyst: "Kerala tapping season ends Jun 1. SW monsoon arrives, disrupting collection. India deficit 6L MT.",
    risk: "Normal monsoon onset. Ivory Coast season adds supply.",
    crude: 72.6, inr: 94.3, chinaIdx: 7.2, supply: 'Tight' },
  { month: "Jul '26", pred: 278, lo: 260, hi: 296, bull: 302, bear: 254, season: 'SW Monsoon Peak',
    momentum: 'bullish', confidence: 78,
    catalyst: "Peak monsoon disrupts Kerala tapping 30-40%. Thailand southern provinces flooded.",
    risk: "SE Asia output recovers. China slowdown risk.",
    crude: 75, inr: 93.8, chinaIdx: 7.4, supply: 'Very Tight' },
  { month: "Aug '26", pred: 285, lo: 265, hi: 305, bull: 315, bear: 258, season: 'Monsoon / ATH zone',
    momentum: 'bullish', confidence: 74,
    catalyst: "Peak disruption. Historical seasonal high month. 6th consecutive global deficit year.",
    risk: "Brent softening limits synthetic sub premium. Early monsoon retreat.",
    crude: 77, inr: 93.3, chinaIdx: 7.1, supply: 'Very Tight' },
  { month: "Sep '26", pred: 280, lo: 260, hi: 300, bull: 308, bear: 252, season: 'Late Monsoon',
    momentum: 'neutral', confidence: 70,
    catalyst: "Tapping resumes mid-Sep. Auto OEM Q4 demand build. INR weak at ₹94/$.",
    risk: "Early monsoon withdrawal. BDI softening.",
    crude: 75, inr: 93.8, chinaIdx: 7.0, supply: 'Tight' },
  { month: "Oct '26", pred: 272, lo: 252, hi: 292, bull: 298, bear: 246, season: 'Post-Monsoon',
    momentum: 'neutral', confidence: 68,
    catalyst: "Supply recovery begins. Tyre OEM festive season demand. Diwali period.",
    risk: "SE Asia harvest recovery adds global supply.",
    crude: 74, inr: 94.0, chinaIdx: 7.2, supply: 'Balanced' },
  { month: "Nov '26", pred: 262, lo: 243, hi: 281, bull: 288, bear: 238, season: 'Post-Harvest Dip',
    momentum: 'bearish', confidence: 65,
    catalyst: "Full Kerala harvest underway. SE Asia peak supply season.",
    risk: "China construction slowdown. Inventory overhang.",
    crude: 72, inr: 94.1, chinaIdx: 6.8, supply: 'Ample' },
  { month: "Dec '26", pred: 255, lo: 237, hi: 273, bull: 280, bear: 232, season: 'Year-End',
    momentum: 'bearish', confidence: 63,
    catalyst: "Pre-wintering inventory build. Q4 tyre demand stable. Year-end destocking.",
    risk: "Inventory overhang from bumper season.",
    crude: 71, inr: 93.9, chinaIdx: 6.5, supply: 'Ample' },
  { month: "Jan '27", pred: 260, lo: 242, hi: 278, bull: 285, bear: 238, season: 'Wintering Starts',
    momentum: 'neutral', confidence: 67,
    catalyst: "Thailand & Indonesia wintering begins. Latex yields drop 35-45%.",
    risk: "Weak European auto demand.",
    crude: 74, inr: 94.2, chinaIdx: 6.8, supply: 'Tightening' },
  { month: "Feb '27", pred: 268, lo: 250, hi: 286, bull: 295, bear: 244, season: 'Deep Wintering',
    momentum: 'bullish', confidence: 71,
    catalyst: "Peak wintering crunch. Chinese New Year pre-buy. India deficit worsens.",
    risk: "ITRC coordinated release.",
    crude: 76, inr: 94.5, chinaIdx: 7.5, supply: 'Tight' },
  { month: "Mar '27", pred: 272, lo: 253, hi: 291, bull: 298, bear: 248, season: 'Late Wintering',
    momentum: 'bullish', confidence: 73,
    catalyst: "Production constrained. China restocking post-CNY. India demand +3.5% YoY.",
    risk: "ANRPC countries increase exports.",
    crude: 77, inr: 94.6, chinaIdx: 7.6, supply: 'Tight' },
  { month: "Apr '27", pred: 278, lo: 258, hi: 298, bull: 305, bear: 252, season: 'Spring Tapping',
    momentum: 'bullish', confidence: 70,
    catalyst: "New season not yet productive. EV tyre demand growth +15% YoY.",
    risk: "Vietnam new plantation areas add supply.",
    crude: 78, inr: 94.7, chinaIdx: 7.7, supply: 'Tight' },
  { month: "May '27", pred: 274, lo: 255, hi: 293, bull: 300, bear: 248, season: 'Recovery Phase',
    momentum: 'neutral', confidence: 65,
    catalyst: "Full tapping resumes. Global demand 1.5% above supply.",
    risk: "Weather normalisation. Macro slowdown risk.",
    crude: 76, inr: 94.6, chinaIdx: 7.3, supply: 'Balanced' },
]

// ─── HISTORICAL YEAR DATA (Rubber Board of India monthly averages) ─────────────

export const YEAR_DATA: Record<number, YearEntry[]> = {
  2023: [
    { m: 'Jan', price: 152 },
    { m: 'Feb', price: 155 },
    { m: 'Mar', price: 158 },
    { m: 'Apr', price: 162 },
    { m: 'May', price: 165 },
    { m: 'Jun', price: 168 },
    { m: 'Jul', price: 170 },
    { m: 'Aug', price: 173 },
    { m: 'Sep', price: 168 },
    { m: 'Oct', price: 163 },
    { m: 'Nov', price: 158 },
    { m: 'Dec', price: 155 }
  ],
  2024: [
    { m: 'Jan', price: 167 },
    { m: 'Feb', price: 173 },
    { m: 'Mar', price: 180 },
    { m: 'Apr', price: 188 },
    { m: 'May', price: 197 },
    { m: 'Jun', price: 210 },
    { m: 'Jul', price: 225 },
    { m: 'Aug', price: 239 },
    { m: 'Sep', price: 228 },
    { m: 'Oct', price: 219 },
    { m: 'Nov', price: 212 },
    { m: 'Dec', price: 205 }
  ],
  2025: [
    { m: 'Jan', price: 192 },
    { m: 'Feb', price: 198 },
    { m: 'Mar', price: 202 },
    { m: 'Apr', price: 218 },
    { m: 'May', price: 228 },
    { m: 'Jun', price: 222 },
    { m: 'Jul', price: 232 },
    { m: 'Aug', price: 248 },
    { m: 'Sep', price: 241 },
    { m: 'Oct', price: 235 },
    { m: 'Nov', price: 178 },
    { m: 'Dec', price: 202 }
  ],
}

export const YEAR_ANALYSIS: Record<number, YearAnalysis> = {
  2023: {
    avg: 162, high: 173, low: 152, highM: 'Aug', lowM: 'Jan',
    change: '+2.0%', headline: 'Steady recovery from multi-year lows', color: '#60a5fa',
    summary: "2023 was a year of gradual rehabilitation. Prices climbed from ₹152/kg in January to ₹173/kg by August, recovering from the 2017–2019 trough era. The uptick was driven by India's surging automotive sector, post-COVID supply-chain normalisation, and steadily widening structural deficit.",
    drivers: [
      { label: 'Demand',    detail: 'India tyre sector output up 8% YoY. Auto sales hit record in H2 2023.',                    icon: '🚗', dir: 'up'  },
      { label: 'Supply',    detail: 'SE Asia production normal. Adequate global supply limited the price upside.',              icon: '🌿', dir: 'dn'  },
      { label: 'Crude oil', detail: 'Brent averaged $82/bbl — moderate synthetic rubber substitution risk maintained.',         icon: '🛢️', dir: 'neu' },
      { label: 'Imports',   detail: 'India imported 4.8L MT to fill deficit. Custom duty structure kept floor elevated.',      icon: '📦', dir: 'up'  },
    ],
    events: [
      { m: 'Mar', event: 'India auto sector records highest quarterly sales since 2019', price: 158 },
      { m: 'Jul', event: 'Global NR demand-supply gap widens to 400,000 MT (ANRPC report)', price: 170 },
      { m: 'Aug', event: 'Monsoon disruption pushes Kerala production down 18%', price: 173 },
      { m: 'Nov', event: 'SE Asia harvest begins — seasonal supply pressure returns', price: 158 },
    ],
  },
  2024: {
    avg: 204, high: 239, low: 167, highM: 'Aug', lowM: 'Jan',
    change: '+22.8%', headline: 'Explosive rally — 15-year domestic high breached', color: '#fb923c',
    summary: "2024 was the breakout year for Indian rubber. Prices surged from ₹167/kg in January to ₹239/kg in August — highest since 2011. China's aggressive pre-quarter stockpiling, severe Kerala monsoon cutting tapping days by 40%, and India's structural 5.5L MT deficit all converged to produce this rally.",
    drivers: [
      { label: 'China stockpile', detail: 'Unprecedented pre-quarter Chinese purchases drained global inventory through Q2.', icon: '🇨🇳', dir: 'up' },
      { label: 'Monsoon shock',   detail: 'Severe SW monsoon cut Kerala tapping days by 40% in July–August 2024.',            icon: '🌧️', dir: 'up' },
      { label: 'Bangladesh',      detail: 'Bangladesh political turmoil disrupted SE Asia rubber trade flows in Jul–Aug.',     icon: '⚠️', dir: 'up' },
      { label: 'Deficit',         detail: "India's 5.5L MT structural deficit became fully priced-in; import costs surged.",  icon: '📦', dir: 'up' },
    ],
    events: [
      { m: 'Apr', event: 'China begins aggressive pre-quarter stockpiling — global spot inventory falls', price: 188 },
      { m: 'Jul', event: 'Bangladesh political crisis disrupts SE Asia trade flows', price: 225 },
      { m: 'Aug', event: 'Domestic all-time high ₹239/kg — monsoon peak + deficit + China demand confluence', price: 239 },
      { m: 'Oct', event: 'SE Asia harvest begins; prices cool as tyre makers destock', price: 219 },
    ],
  },
  2025: {
    avg: 216, high: 248, low: 178, highM: 'Aug', lowM: 'Nov',
    change: '+5.9%', headline: 'Sustained highs — near-ATH with sharp November correction', color: '#4ade80',
    summary: "2025 consolidated the 2024 rally and pushed further. Prices hit ₹248/kg in August — matching global records. Rubber Board's export incentive scheme (₹5/kg rebate) tightened domestic supply further. The November dip to ₹178/kg was sharp but brief, driven by a SE Asia bumper harvest coinciding with softer Chinese demand, before recovering into year-end.",
    drivers: [
      { label: 'Export incentive', detail: "Rubber Board's ₹5/kg export rebate drove exports higher, tightening domestic supply.",  icon: '📋', dir: 'up' },
      { label: 'EV demand',        detail: 'EV tyre sector growth +12% YoY adds NR demand premium vs synthetic rubber.',           icon: '⚡', dir: 'up' },
      { label: 'Indonesia output', detail: 'Indonesia production -9.8% YoY as smallholders shift to palm oil at higher margins.', icon: '🌴', dir: 'up' },
      { label: 'Nov correction',   detail: 'SE Asia bumper harvest + China demand softening caused a sharp ₹70/kg correction.',   icon: '📉', dir: 'dn' },
    ],
    events: [
      { m: 'Jan', event: 'Rubber Board export incentive scheme (₹5/kg) announced — squeezes domestic supply', price: 192 },
      { m: 'May', event: 'Global NR deficit crosses 665,000 MT — 5th consecutive year of deficit (ANRPC)', price: 228 },
      { m: 'Aug', event: '₹248/kg — near all-time high; structural deficit + weather disruption confluence', price: 248 },
      { m: 'Nov', event: 'Sharp ₹70/kg correction: SE Asia bumper harvest + China demand slowdown', price: 178 },
    ],
  },
}

// ─── 2026 DATA (Jan–Jun actual + Jul–Dec forecast) ────────────────────────────
// Actual prices: Rubber Board daily data, RSS4 Kottayam monthly averages
// Live price Jun 28: ₹270.0/kg (source: rubberboard.gov.in)

export const YEAR_DATA_2026: YearEntry2026[] = [
  { m: 'Jan', price: 208, type: 'actual' },
  { m: 'Feb', price: 225, type: 'actual' },
  { m: 'Mar', price: 198, type: 'actual' },
  { m: 'Apr', price: 208, type: 'actual' },
  { m: 'May', price: 252, type: 'actual' },
  { m: 'Jun', price: 270, type: 'actual' },
  { m: 'Jul', price: 278, type: 'forecast', lo: 260, hi: 296 },
  { m: 'Aug', price: 285, type: 'forecast', lo: 265, hi: 305 },
  { m: 'Sep', price: 280, type: 'forecast', lo: 260, hi: 300 },
  { m: 'Oct', price: 272, type: 'forecast', lo: 252, hi: 292 },
  { m: 'Nov', price: 262, type: 'forecast', lo: 243, hi: 281 },
  { m: 'Dec', price: 255, type: 'forecast', lo: 237, hi: 273 }
]

export const KARNATAKA_2026: YearEntry2026[] = [
  { m: 'Jan', price: 191, type: 'actual' },
  { m: 'Feb', price: 207, type: 'actual' },
  { m: 'Mar', price: 182, type: 'actual' },
  { m: 'Apr', price: 191, type: 'actual' },
  { m: 'May', price: 232, type: 'actual' },
  { m: 'Jun', price: 248, type: 'actual' },
  { m: 'Jul', price: 256, type: 'forecast', lo: 237, hi: 275 },
  { m: 'Aug', price: 262, type: 'forecast', lo: 241, hi: 284 },
  { m: 'Sep', price: 258, type: 'forecast', lo: 237, hi: 279 },
  { m: 'Oct', price: 250, type: 'forecast', lo: 229, hi: 272 },
  { m: 'Nov', price: 241, type: 'forecast', lo: 221, hi: 261 },
  { m: 'Dec', price: 235, type: 'forecast', lo: 216, hi: 254 }
]

YEAR_DATA[2026] = YEAR_DATA_2026.map(d => ({ m: d.m, price: d.price }))

export const YEAR_ANALYSIS_2026: YearAnalysis = {
  avg: Math.round(YEAR_DATA_2026.reduce((s, d) => s + d.price, 0) / 12),
  high: 285, highM: 'Aug (fcst)',
  low:  198, lowM:  'Mar (actual)',
  change: '+37.0% (Jan→Aug forecast peak)',
  headline: 'Breaking ATH — structural deficit + weak INR + monsoon peak',
  color: '#818cf8',
  summary: "2026 is shaping up as a historic year. After a Jan-Feb recovery from year-end softness, a brief Mar dip to ₹198/kg (post-harvest) was followed by a strong rally back to ₹270/kg by June. The weak rupee (₹94.3/$ vs ₹85/$ in 2025) makes imports expensive, supporting domestic prices above ₹270.0/kg currently. The monsoon season (Jul–Aug) is forecast to push prices toward a new ATH of ₹285/kg, as tapping disruption coincides with the 6th consecutive year of global deficit.",
  drivers: [
    { label: 'Weak INR',         detail: 'INR at ₹94.3/$ (+11% vs 2025 avg) makes import parity level ~₹271/kg, supporting domestic prices.',  icon: '💱', dir: 'up' },
    { label: 'Thailand weather', detail: 'Heavy rainfall in Surat Thani and Nakhon Si Thammarat disrupts tapping Jun–Aug.',                                               icon: '🌧️', dir: 'up' },
    { label: 'Global deficit',   detail: '6th consecutive year of NR supply deficit — now estimated 700,000+ MT (ANRPC 2026).',                                            icon: '📦', dir: 'up' },
    { label: 'Mar–Apr dip',      detail: 'Post-harvest softness + improved SE Asia supply briefly pulled prices to ₹198–208/kg before recovering.',                       icon: '📉', dir: 'dn' },
  ],
  events: [
    { m: 'Jan', event: 'Post-harvest softness. RSS4 opens at ₹208/kg after Dec correction.', price: 208 },
    { m: 'Feb', event: 'Wintering tightens SE Asia supply. Recovery to ₹225/kg.', price: 225 },
    { m: 'Mar', event: 'Year low ₹198/kg — SE Asia bumper carry + China demand uncertainty.', price: 198 },
    { m: 'May', event: '₹252/kg surge — Thailand disruption + China pre-quarter buying.', price: 252 },
    { m: 'Jun', event: '₹270/kg — SW monsoon arrives; tapping halts across Kerala & Karnataka.', price: 270 },
    { m: 'Aug', event: 'FORECAST: ₹285/kg peak — monsoon trough + structural deficit + weak INR confluence.', price: 285 },
  ],
}

// ─── NEWS FEED (real signals as of 28 Jun 2026) ─────────────────────────

export const NEWS_FEED: NewsItem[] = [
  { time: 'Live', tag: 'BULLISH', text: "Kottayam RSS4 at ₹270/kg — near all-time high as SW monsoon halts Kerala tapping",         icon: '📈' },
  { time: '2h',   tag: 'SUPPLY',  text: "Kerala tapping season closed — SW monsoon arrived Jun 1; RSS4 supply from Kerala near zero",              icon: '🌧️' },
  { time: '4h',   tag: 'DEMAND',  text: "India tyre imports surge — domestic shortage drives OEMs to source from Thailand at ₹288/kg equiv",   icon: '🚗' },
  { time: '6h',   tag: 'GLOBAL',  text: "International RSS4 at ₹287.75/100kg — INR at ₹94.3/$ makes imports expensive, supporting domestic premium",   icon: '🌏' },
  { time: '8h',   tag: 'CRUDE',   text: "Brent crude at $72.6/bbl — synthetic rubber (SBR) remains ₹30-35/kg above NR; SBR substitution risk LOW",  icon: '🛢️' },
  { time: '12h',  tag: 'SUPPLY',  text: "ANRPC: Global NR deficit for 2026 estimated 700,000 MT — 6th consecutive year of undersupply",           icon: '🌴' },
  { time: '1d',   tag: 'POLICY',  text: "Rubber Board confirms ₹5/kg export subsidy continues — tightening domestic availability further",         icon: '📋' },
]

export const TAG_COLORS: Record<string, TagColor> = {
  BULLISH: { bg: '#2d1b1b', text: '#f87171', border: '#7f1d1d' },
  SUPPLY:  { bg: '#1a2535', text: '#60a5fa', border: '#1e3a5f' },
  DEMAND:  { bg: '#1a2b1a', text: '#4ade80', border: '#14532d' },
  GLOBAL:  { bg: '#2b1f35', text: '#c084fc', border: '#581c87' },
  CRUDE:   { bg: '#2b2110', text: '#fb923c', border: '#7c2d12' },
  POLICY:  { bg: '#1f2a2b', text: '#34d399', border: '#064e3b' },
}
