import nodemailer from 'nodemailer'
import { getDb } from '../db.js'

export const RATE_GRADES = ['rss4', 'rss5', 'lot', 'scrap']
const GRADE_LABELS = { rss4: 'RSS4', rss5: 'RSS5', lot: 'Lot', scrap: 'Scrap' }

let mailTransporter = null
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) !== 587,   // 465 = implicit TLS, 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
} else {
  console.warn('[mail] SMTP_HOST/SMTP_USER/SMTP_PASS not set — purchase rate emails will be skipped. See .env.example.')
}

// Emails every customer with an email on file the day's purchase rates.
// Returns a summary instead of throwing — a save should still succeed even if
// mail delivery fails or isn't configured.
export async function emailRateToCustomers(date, rates) {
  const customers = await getDb().collection('customers')
    .find({ email: { $exists: true, $ne: '' } })
    .toArray()

  if (!mailTransporter || customers.length === 0) {
    return { attempted: 0, sent: 0, failed: 0 }
  }

  const rows = RATE_GRADES
    .filter((g) => rates[g] != null)
    .map((g) => `<tr><td style="padding:4px 12px;color:#475569">${GRADE_LABELS[g]}</td><td style="padding:4px 12px;font-weight:700">₹${rates[g]}/kg</td></tr>`)
    .join('')

  let sent = 0, failed = 0
  await Promise.all(customers.map(async (customer) => {
    try {
      await mailTransporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: customer.email,
        subject: `Rubber purchase rate for ${date}`,
        html: `
          <p>Hi ${customer.fullName || 'there'},</p>
          <p>Today's rubber purchase rate (${date}):</p>
          <table style="border-collapse:collapse">${rows}</table>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px">— Rubber Trader</p>
        `,
      })
      sent += 1
    } catch (err) {
      failed += 1
      console.warn(`[mail] Failed to send rate email to ${customer.email}:`, err.message)
    }
  }))

  return { attempted: customers.length, sent, failed }
}
