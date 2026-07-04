import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../db.js'

const router = Router()

function serializeCustomer(customer) {
  if (!customer) return null
  const { _id, createdAt, updatedAt, ...rest } = customer
  return { id: _id.toString(), ...rest }
}

function normalizeCustomer(customer) {
  return {
    fullName: customer.fullName ?? '',
    mobile: customer.mobile ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    village: customer.village ?? '',
    district: customer.district ?? '',
    state: customer.state ?? '',
    pinCode: customer.pinCode ?? '',
    bank: {
      holder: customer.bank?.holder ?? '',
      accountNumber: customer.bank?.accountNumber ?? '',
      ifsc: customer.bank?.ifsc?.toUpperCase() ?? '',
      bankName: customer.bank?.bankName ?? '',
      branch: customer.bank?.branch ?? '',
      city: customer.bank?.city ?? '',
      state: customer.bank?.state ?? '',
      verified: Boolean(customer.bank?.verified),
    },
  }
}

router.get('/customers', async (req, res) => {
  const customers = await getDb().collection('customers').find({}).toArray()
  res.json({ success: true, customers: customers.map(serializeCustomer) })
})

router.post('/customers', async (req, res) => {
  const customer = req.body
  if (!customer?.fullName || !customer?.mobile) {
    return res.status(400).json({ success: false, message: 'Name and mobile are required.' })
  }

  const doc = {
    ...normalizeCustomer(customer),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const db = getDb()
  const result = await db.collection('customers').insertOne(doc)
  const saved = await db.collection('customers').findOne({ _id: result.insertedId })

  return res.json({ success: true, customer: serializeCustomer(saved) })
})

router.put('/customers/:id', async (req, res) => {
  const { id } = req.params
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid customer id.' })
  }

  const customer = req.body
  if (!customer?.fullName || !customer?.mobile) {
    return res.status(400).json({ success: false, message: 'Name and mobile are required.' })
  }

  const update = {
    ...normalizeCustomer(customer),
    updatedAt: new Date(),
  }

  const db = getDb()
  const result = await db.collection('customers').updateOne({ _id: new ObjectId(id) }, { $set: update })
  if (result.matchedCount === 0) {
    return res.status(404).json({ success: false, message: 'Customer not found.' })
  }

  const updated = await db.collection('customers').findOne({ _id: new ObjectId(id) })
  return res.json({ success: true, customer: serializeCustomer(updated) })
})

export default router
