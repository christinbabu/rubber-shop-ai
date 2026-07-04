import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

function toSafeUser(user) {
  return {
    id: user._id.toString(),
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    address: user.address,
    village: user.village,
    district: user.district,
    state: user.state,
    pinCode: user.pinCode,
    bank: user.bank,
  }
}

router.post('/login', async (req, res) => {
  const { role, email, password } = req.body
  if (!role || !email || !password) {
    return res.status(400).json({ success: false, message: 'Role, email, and password are required.' })
  }

  const user = await getDb()
    .collection('users')
    .findOne({ role, email: email.toLowerCase(), password })

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' })
  }

  return res.json({ success: true, user: toSafeUser(user) })
})

router.post('/register', async (req, res) => {
  const { fullName, email, password, mobile, address, village, district, state, pinCode, bank } = req.body
  if (!fullName || !email || !password || !mobile || !address || !village || !district || !state || !pinCode || !bank) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' })
  }

  const users = getDb().collection('users')
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
  if (!passwordPattern.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.',
    })
  }

  const existing = await users.findOne({ email: email.toLowerCase() })
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered.' })
  }

  const newUser = {
    role: 'customer',
    fullName,
    email: email.toLowerCase(),
    password,
    mobile,
    address,
    village,
    district,
    state,
    pinCode,
    bank: {
      holder: bank.holder,
      accountNumber: bank.accountNumber,
      ifsc: bank.ifsc.toUpperCase(),
      bankName: bank.bankName,
      branch: bank.branch,
      city: bank.city,
      state: bank.state,
      verified: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await users.insertOne(newUser)
  const user = await users.findOne({ _id: result.insertedId })

  if (!user) {
    return res.status(500).json({ success: false, message: 'Failed to create user.' })
  }

  return res.json({ success: true, user: toSafeUser(user) })
})

export default router
