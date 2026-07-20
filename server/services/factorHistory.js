import { getDb } from '../db.js'

// Snapshots of every live-derived market factor value, taken on a fixed
// interval (see server/index.js) so each factor can be charted over time —
// independent of savePriceSnapshot in priceSources.js, which only tracks the
// raw scraped prices (Kottayam/Bangkok/Brent/INR), not the derived indices.
export async function saveFactorSnapshot(values) {
  const db = getDb()
  if (!db) return
  try {
    await db.collection('factor_history').insertOne({ fetchedAt: new Date(), ...values })
  } catch (err) {
    console.warn('[DB] Factor snapshot save failed:', err.message)
  }
}

export async function getFactorHistory(days) {
  const db = getDb()
  if (!db) return []
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return db.collection('factor_history')
    .find({ fetchedAt: { $gte: since } })
    .sort({ fetchedAt: 1 })
    .toArray()
}
