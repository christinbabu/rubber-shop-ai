import { useState } from 'react'
import { createId } from '../../utils/helpers'
import type { Customer } from '../../types'

interface RegisterProps {
  onRegister: (customer: Customer) => Promise<void>
  onBackClick: () => void
}

const emptyRegisterData = {
  fullName: '',
  mobile: '',
  email: '',
  password: '',
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

export function Register({ onRegister, onBackClick }: RegisterProps) {
  const [registerData, setRegisterData] = useState(emptyRegisterData)
  const [isLoading, setIsLoading] = useState(false)

  const handleRegisterChange = (field: string, value: string) => {
    const next = { ...registerData, [field]: value }
    setRegisterData(next)
  }

  const handleRegisterSubmit = async () => {
    if (
      !registerData.fullName ||
      !registerData.mobile ||
      !registerData.email ||
      !registerData.password ||
      !registerData.address ||
      !registerData.village ||
      !registerData.district ||
      !registerData.stateName ||
      !registerData.pinCode ||
      !registerData.bankHolder ||
      !registerData.accountNumber ||
      !registerData.ifsc ||
      !registerData.bankName ||
      !registerData.branch ||
      !registerData.city ||
      !registerData.bankState
    ) {
      window.alert('Please complete all required customer and bank fields.')
      return
    }

    setIsLoading(true)
    try {
      const newCustomer: Customer = {
        id: createId('cust'),
        fullName: registerData.fullName,
        mobile: registerData.mobile,
        email: registerData.email,
        address: registerData.address,
        village: registerData.village,
        district: registerData.district,
        state: registerData.stateName,
        pinCode: registerData.pinCode,
        bank: {
          holder: registerData.bankHolder,
          accountNumber: registerData.accountNumber,
          ifsc: registerData.ifsc.toUpperCase(),
          bankName: registerData.bankName,
          branch: registerData.branch,
          city: registerData.city,
          state: registerData.bankState,
          verified: false,
        },
      }

      await onRegister(newCustomer)
      setRegisterData(emptyRegisterData)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="register-card">
      <h1>Customer Registration</h1>
      <div className="form-grid">
        <label>
          Full Name
          <input value={registerData.fullName} onChange={(event) => handleRegisterChange('fullName', event.target.value)} />
        </label>
        <label>
          Mobile Number
          <input type="tel" value={registerData.mobile} onChange={(event) => handleRegisterChange('mobile', event.target.value)} />
        </label>
        <label>
          Email Address
          <input type="email" value={registerData.email} onChange={(event) => handleRegisterChange('email', event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={registerData.password} onChange={(event) => handleRegisterChange('password', event.target.value)} />
        </label>
        <label>
          Address
          <input value={registerData.address} onChange={(event) => handleRegisterChange('address', event.target.value)} />
        </label>
        <label>
          Village / Place
          <input value={registerData.village} onChange={(event) => handleRegisterChange('village', event.target.value)} />
        </label>
        <label>
          District
          <input value={registerData.district} onChange={(event) => handleRegisterChange('district', event.target.value)} />
        </label>
        <label>
          State
          <input value={registerData.stateName} onChange={(event) => handleRegisterChange('stateName', event.target.value)} />
        </label>
        <label>
          PIN Code
          <input value={registerData.pinCode} onChange={(event) => handleRegisterChange('pinCode', event.target.value)} />
        </label>
      </div>
      <h2>Bank Information</h2>
      <div className="form-grid">
        <label>
          Account Holder Name
          <input value={registerData.bankHolder} onChange={(event) => handleRegisterChange('bankHolder', event.target.value)} />
        </label>
        <label>
          Account Number
          <input value={registerData.accountNumber} onChange={(event) => handleRegisterChange('accountNumber', event.target.value)} />
        </label>
        <label>
          IFSC Code
          <input value={registerData.ifsc} onChange={(event) => handleRegisterChange('ifsc', event.target.value)} placeholder="e.g. SBIN0005678" />
        </label>
        <label>
          Bank Name
          <input value={registerData.bankName} readOnly />
        </label>
        <label>
          Branch Name
          <input value={registerData.branch} readOnly />
        </label>
        <label>
          City
          <input value={registerData.city} readOnly />
        </label>
        <label>
          State
          <input value={registerData.bankState} readOnly />
        </label>
      </div>
      <div className="button-row">
        <button type="button" className="button button-primary" onClick={handleRegisterSubmit} disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register Customer'}
        </button>
        <button type="button" className="button button-secondary" onClick={onBackClick}>
          Back to Login
        </button>
      </div>
    </main>
  )
}
