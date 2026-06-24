import React from 'react'
import { createId } from '../../utils/helpers'
import type { Customer } from '../../types'

interface AddCustomerFormProps {
  onAddCustomer: (customer: Customer) => void
}

const emptyForm = {
  fullName: '',
  mobile: '',
  email: '',
  address: '',
  village: '',
  district: '',
  stateName: '',
  pinCode: '',
  bankHolder: '',
  accountNumber: '',
  ifsc: '',
  bankName: '',
  branch: '',
  city: '',
  bankState: '',
}

export function AddCustomerForm({ onAddCustomer }: AddCustomerFormProps) {
  const [form, setForm] = React.useState(emptyForm)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (
      !form.fullName ||
      !form.mobile ||
      !form.email ||
      !form.address ||
      !form.village ||
      !form.district ||
      !form.stateName ||
      !form.pinCode ||
      !form.bankHolder ||
      !form.accountNumber ||
      !form.ifsc ||
      !form.bankName ||
      !form.branch ||
      !form.city ||
      !form.bankState
    ) {
      window.alert('Please complete all required customer and bank fields.')
      return
    }

    const newCustomer: Customer = {
      id: createId('cust'),
      fullName: form.fullName,
      mobile: form.mobile,
      email: form.email,
      address: form.address,
      village: form.village,
      district: form.district,
      state: form.stateName,
      pinCode: form.pinCode,
      bank: {
        holder: form.bankHolder,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc.toUpperCase(),
        bankName: form.bankName,
        branch: form.branch,
        city: form.city,
        state: form.bankState,
        verified: false,
      },
    }

    onAddCustomer(newCustomer)
    setForm(emptyForm)
  }

  return (
    <div className="card">
      <h2>Add New Customer</h2>
      <div className="form-grid">
        <label>
          Full Name
          <input value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} />
        </label>
        <label>
          Mobile Number
          <input value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} />
        </label>
        <label>
          Email Address
          <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
        </label>
        <label>
          Address
          <input value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
        </label>
        <label>
          Village / Place
          <input value={form.village} onChange={(e) => handleChange('village', e.target.value)} />
        </label>
        <label>
          District
          <input value={form.district} onChange={(e) => handleChange('district', e.target.value)} />
        </label>
        <label>
          State
          <input value={form.stateName} onChange={(e) => handleChange('stateName', e.target.value)} />
        </label>
        <label>
          PIN Code
          <input value={form.pinCode} onChange={(e) => handleChange('pinCode', e.target.value)} />
        </label>
      </div>
      <h3>Bank Details</h3>
      <div className="form-grid">
        <label>
          Account Holder Name
          <input value={form.bankHolder} onChange={(e) => handleChange('bankHolder', e.target.value)} />
        </label>
        <label>
          Account Number
          <input value={form.accountNumber} onChange={(e) => handleChange('accountNumber', e.target.value)} />
        </label>
        <label>
          IFSC Code
          <input value={form.ifsc} onChange={(e) => handleChange('ifsc', e.target.value)} placeholder="e.g. SBIN0005678" />
        </label>
        <label>
          Bank Name
          <input value={form.bankName} onChange={(e) => handleChange('bankName', e.target.value)} />
        </label>
        <label>
          Branch Name
          <input value={form.branch} onChange={(e) => handleChange('branch', e.target.value)} />
        </label>
        <label>
          City
          <input value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
        </label>
        <label>
          State
          <input value={form.bankState} onChange={(e) => handleChange('bankState', e.target.value)} />
        </label>
      </div>
      <div className="button-row">
        <button type="button" className="button button-primary" onClick={handleSubmit}>
          Add Customer
        </button>
      </div>
    </div>
  )
}
