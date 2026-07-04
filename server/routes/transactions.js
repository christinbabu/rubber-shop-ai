import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

function serializeTransaction(transaction) {
  if (!transaction) return null
  const { _id, ...rest } = transaction
  return { id: _id.toString(), ...rest }
}

router.get('/transactions', async (req, res) => {
  const transactions = await getDb().collection('transactions').find({}).toArray()
  res.json({ success: true, transactions: transactions.map(serializeTransaction) })
})

router.post('/transactions', async (req, res) => {
  const transaction = req.body
  if (!transaction?.customerId || transaction?.quantity == null || transaction?.rate == null || !transaction?.date) {
    return res.status(400).json({ success: false, message: 'Customer, date, quantity, and rate are required.' })
  }

  const doc = {
    customerId: transaction.customerId,
    date: transaction.date,
    rubberType: transaction.rubberType || '',
    quantity: Number(transaction.quantity),
    rate: Number(transaction.rate),
    deduction: Number(transaction.deduction || 0),
    status: transaction.status || 'Pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const db = getDb()
  const result = await db.collection('transactions').insertOne(doc)
  const saved = await db.collection('transactions').findOne({ _id: result.insertedId })
  return res.json({ success: true, transaction: serializeTransaction(saved) })
})

export default router
