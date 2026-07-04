import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../db.js'

const router = Router()

router.get('/users/:id', async (req, res) => {
  const id = req.params.id
  const user = await getDb().collection('users').findOne({ _id: new ObjectId(id) }).catch(() => null)
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' })
  delete user.password
  return res.json({ success: true, user })
})

router.get('/users', async (req, res) => {
  const role = req.query.role
  const query = role ? { role } : {}
  const users = await getDb().collection('users').find(query).toArray()
  users.forEach((user) => delete user.password)
  res.json({ success: true, users })
})

export default router
