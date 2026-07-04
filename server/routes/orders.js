import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../db.js'

const router = Router()

function serializeOrder(order) {
  if (!order) return null
  const { _id, ...rest } = order
  return { id: _id.toString(), ...rest }
}

router.get('/orders', async (req, res) => {
  const orders = await getDb().collection('orders').find({}).toArray()
  res.json({ success: true, orders: orders.map(serializeOrder) })
})

router.post('/orders', async (req, res) => {
  const order = req.body
  if (!order?.customerId || !Array.isArray(order.items) || !order?.createdAt) {
    return res.status(400).json({ success: false, message: 'Customer, items, and createdAt are required.' })
  }

  const doc = {
    customerId: order.customerId,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
    deliveryAddress: order.deliveryAddress || '',
    mobile: order.mobile || '',
    paymentMethod: order.paymentMethod || 'Cash on Delivery',
    status: order.status || 'Pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const db = getDb()
  const result = await db.collection('orders').insertOne(doc)
  const saved = await db.collection('orders').findOne({ _id: result.insertedId })

  if (saved) {
    for (const item of doc.items) {
      await db.collection('products').updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } },
      )
    }
  }

  return res.json({ success: true, order: serializeOrder(saved) })
})

export default router
