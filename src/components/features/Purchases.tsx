import { useState } from 'react'
import { createId, todayString, formatCurrency } from '../../utils/helpers'
import type { Customer, Transaction } from '../../types'

interface PurchasesProps {
  customers: Customer[]
  transactions: Transaction[]
  onAddTransaction: (transaction: Transaction) => void
  onAddCustomer: (customer: Customer) => void
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

export function Purchases({ customers, transactions, onAddTransaction, onAddCustomer }: PurchasesProps) {
  const [form, setForm] = useState(emptyForm)
  const [quickCustomer, setQuickCustomer] = useState({ fullName: '', mobile: '' })

  const handleAddTransaction = () => {
    const quantity = Number(form.quantity)
    const rate = Number(form.rate)
    if (!quantity || !rate) {
      window.alert('Quantity and rate must be greater than 0.')
      return
    }

    let customerId = form.customerId

    if (!customerId) {
      if (!quickCustomer.fullName.trim() || !quickCustomer.mobile.trim()) {
        window.alert('Choose an existing customer or enter a new customer name and phone number.')
        return
      }

      const newCustomer: Customer = {
        id: createId('cust'),
        fullName: quickCustomer.fullName.trim(),
        mobile: quickCustomer.mobile.trim(),
        email: '',
        address: '',
        village: '',
        district: '',
        state: '',
        pinCode: '',
        bank: {
          holder: '',
          accountNumber: '',
          ifsc: '',
          bankName: '',
          branch: '',
          city: '',
          state: '',
          verified: false,
        },
      }

      onAddCustomer(newCustomer)
      customerId = newCustomer.id
    }

    const newTransaction: Transaction = {
      id: createId('txn'),
      customerId,
      date: form.date,
      rubberType: form.rubberType,
      quantity,
      rate,
      deduction: Number(form.deduction),
      status: form.status,
    }
    onAddTransaction(newTransaction)
    setForm({ ...emptyForm, date: todayString() })
    setQuickCustomer({ fullName: '', mobile: '' })
  }

  return (
    <>
      <div className="card">
        <h2>Add Rubber Purchase Entry</h2>
        <div className="form-grid">
          <label>
            Existing Customer
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
            New Customer Name
            <input
              value={quickCustomer.fullName}
              onChange={(e) => setQuickCustomer((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Enter name"
            />
          </label>
          <label>
            New Customer Phone
            <input
              value={quickCustomer.mobile}
              onChange={(e) => setQuickCustomer((prev) => ({ ...prev, mobile: e.target.value }))}
              placeholder="Enter phone"
            />
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
        <p className="form-help">
          Enter a name and phone number to register a customer while saving this purchase. You can add the rest of the details later from the admin customer screen.
        </p>
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
