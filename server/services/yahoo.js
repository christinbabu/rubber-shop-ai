// Shared Yahoo Finance chart-API quote fetcher, used for commodities, FX pairs,
// and NSE-listed equities alike — they all share the same endpoint shape.
export async function fetchYahooQuote(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  const json = await resp.json()
  const result = json?.chart?.result?.[0]
  const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter((v) => v != null)
  if (closes.length === 0) return null

  const last = closes.at(-1)
  const prev = closes.length > 1 ? closes.at(-2) : last
  return {
    price: Math.round(last * 100) / 100,
    changePct: prev ? Math.round(((last - prev) / prev) * 10000) / 100 : 0,
    currency: result?.meta?.currency ?? null,
  }
}
