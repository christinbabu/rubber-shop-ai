import { useMemo, useState } from 'react'
import type { Customer, Transaction } from '../../types'
import { formatCurrency } from '../../utils/helpers'

interface ReportsProps {
  customers: Customer[]
  transactions: Transaction[]
}

export function Reports({ customers, transactions }: ReportsProps) {
  const [nameFilter, setNameFilter] = useState('')
  const [placeFilter, setPlaceFilter] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')

  const filteredTransactions = useMemo(() => {
    const nameQuery = nameFilter.trim().toLowerCase()
    const placeQuery = placeFilter.trim().toLowerCase()
    const phoneQuery = phoneFilter.trim().toLowerCase()
    const emailQuery = emailFilter.trim().toLowerCase()

    return transactions.filter((txn) => {
      const customer = customers.find((customerItem) => customerItem.id === txn.customerId)
      if (!customer) return false

      const placeValue = `${customer.village} ${customer.district} ${customer.state}`.trim().toLowerCase()
      const nameValue = customer.fullName.toLowerCase()
      const phoneValue = customer.mobile.toLowerCase()
      const emailValue = customer.email.toLowerCase()

      const nameMatch = !nameQuery || nameValue.includes(nameQuery)
      const placeMatch = !placeQuery || placeValue.includes(placeQuery)
      const phoneMatch = !phoneQuery || phoneValue.includes(phoneQuery)
      const emailMatch = !emailQuery || emailValue.includes(emailQuery)

      return nameMatch && placeMatch && phoneMatch && emailMatch
    })
  }, [nameFilter, placeFilter, phoneFilter, emailFilter, transactions, customers])

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Purchase Report</h2>
            <p>Search purchases by customer name, place, phone, or email.</p>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Customer Name
            <input
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Enter customer name"
            />
          </label>
          <label>
            Place
            <input
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}
              placeholder="Enter village, district, or state"
            />
          </label>
          <label>
            Phone
            <input
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Enter phone number"
            />
          </label>
          <label>
            Email
            <input
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Enter email address"
            />
          </label>
        </div>
      </div>
      <div className="card">
        <h2>Purchase History</h2>
        <p className="muted">
          Showing {filteredTransactions.length} of {transactions.length} purchase entries.
        </p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Place</th>
              <th>Phone</th>
              <th>Email</th>
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
            {filteredTransactions.map((txn) => {
              const customer = customers.find((c) => c.id === txn.customerId)
              const total = txn.quantity * txn.rate
              const net = total - txn.deduction
              return (
                <tr key={txn.id}>
                  <td data-label="Date">{txn.date}</td>
                  <td data-label="Customer">{customer?.fullName ?? 'Unknown'}</td>
                  <td data-label="Place">{customer ? `${customer.village || customer.district || customer.state}` : 'Unknown'}</td>
                  <td data-label="Phone">{customer?.mobile ?? 'N/A'}</td>
                  <td data-label="Email">{customer?.email ?? 'N/A'}</td>
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
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center' }}>
                  No purchases match the search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
