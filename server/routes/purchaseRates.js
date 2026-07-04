import { Router } from 'express'
import { getDb } from '../db.js'
import { RATE_GRADES, emailRateToCustomers } from '../services/mail.js'

const router = Router()

router.get('/purchase-rates', async (req, res) => {
  try {
    const year  = parseInt(req.query.year)
    const month = parseInt(req.query.month)   // 1-12
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'year and month (1-12) are required.' })
    }
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const records = await getDb().collection('purchase_rates')
      .find({ date: { $regex: `^${prefix}` } })
      .toArray()
    res.json({
      success: true,
      rates: records.map(r => ({ date: r.date, rates: r.rates, updatedAt: r.updatedAt })),
    })
  } catch (err) {
    res.status(503).json({ success: false, error: err.message })
  }
})

router.post('/purchase-rates', async (req, res) => {
  try {
    const { date, rates } = req.body
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      return res.status(400).json({ success: false, message: 'date must be YYYY-MM-DD.' })
    }
    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ success: false, message: 'rates object is required.' })
    }

    const cleanRates = {}
    for (const grade of RATE_GRADES) {
      if (rates[grade] == null || rates[grade] === '') continue
      const num = Number(rates[grade])
      if (!Number.isFinite(num) || num <= 0) {
        return res.status(400).json({ success: false, message: `${grade} must be a positive number.` })
      }
      cleanRates[grade] = num
    }
    if (Object.keys(cleanRates).length === 0) {
      return res.status(400).json({ success: false, message: 'At least one grade rate is required.' })
    }

    const updatedAt = new Date()
    await getDb().collection('purchase_rates').updateOne(
      { date },
      { $set: { date, rates: cleanRates, updatedAt } },
      { upsert: true },
    )

    const emailed = await emailRateToCustomers(date, cleanRates)

    res.json({ success: true, date, rates: cleanRates, updatedAt, emailed })
  } catch (err) {
    res.status(503).json({ success: false, error: err.message })
  }
})

router.delete('/purchase-rates/:date', async (req, res) => {
  try {
    const { date } = req.params
    await getDb().collection('purchase_rates').deleteOne({ date })
    res.json({ success: true })
  } catch (err) {
    res.status(503).json({ success: false, error: err.message })
  }
})

export default router
