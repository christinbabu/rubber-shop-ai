import { useState } from 'react'
import { createId, todayString, formatCurrency } from '../../utils/helpers'
import type { Customer, Transaction } from '../../types'

interface PurchasesProps {
  customers: Customer[]
  transactions: Transaction[]
  onAddTransaction: (transaction: Transaction) => void
}

const emptyForm = {
  customerId: '',
  rubberType: 'RSS',
  date: todayString(),
  quantity: '0',
  rate: '0',
  deduction: '0',
  status: 'Pending' as const,
}

export function Purchases({ customers, transactions, onAddTransaction }: PurchasesProps) {
  const [form, setForm] = useState(emptyForm)

  const handleAddTransaction = () => {
    if (!form.customerId) {
      window.alert('Please choose a customer.')
      return
    }
    const quantity = Number(form.quantity)
    const rate = Number(form.rate)
    if (!quantity || !rate) {
      window.alert('Quantity and rate must be greater than 0.')
      return
    }

    const newTransaction: Transaction = {
      id: createId('txn'),
      customerId: form.customerId,
      date: form.date,
      rubberType: form.rubberType,
      quantity,
      rate,
      deduction: Number(form.deduction),
      status: form.status,
    }
    onAddTransaction(newTransaction)
    setForm({ ...emptyForm, date: todayString() })
  }

  return (
    <>
      <div className="card">
        <h2>Add Rubber Purchase Entry</h2>
        <div className="form-grid">
          <label>
            Customer
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Purchase Date
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label>
            Rubber Type
            <input value={form.rubberType} onChange={(e) => setForm({ ...form, rubberType: e.target.value })} />
          </label>
          <label>
            Quantity (KG)
            <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </label>
          <label>
            Rate (₹ / KG)
            <input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </label>
          <label>
            Deduction (₹)
            <input type="number" value={form.deduction} onChange={(e) => setForm({ ...form, deduction: e.target.value })} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </label>
        </div>
        <button type="button" className="button button-primary" onClick={handleAddTransaction}>
          Save Purchase
        </button>
      </div>
      <div className="card">
        <h2>Purchase History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Total</th>
              <th>Deduction</th>
              <th>Net</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => {
              const customer = customers.find((c) => c.id === txn.customerId)
              const total = txn.quantity * txn.rate
              const net = total - txn.deduction
              return (
                <tr key={txn.id}>
                  <td data-label="Date">{txn.date}</td>
                  <td data-label="Customer">{customer?.fullName ?? 'Unknown'}</td>
                  <td data-label="Type">{txn.rubberType}</td>
                  <td data-label="Quantity">{txn.quantity}</td>
                  <td data-label="Rate">{formatCurrency(txn.rate)}</td>
                  <td data-label="Total">{formatCurrency(total)}</td>
                  <td data-label="Deduction">{formatCurrency(txn.deduction)}</td>
                  <td data-label="Net">{formatCurrency(net)}</td>
                  <td data-label="Status">{txn.status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
