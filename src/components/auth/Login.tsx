import { useState } from 'react'
import type { Role } from '../../types'
import { roleOptions } from '../../utils/constants'

interface LoginProps {
  onLogin: (role: Role, email: string, password: string) => Promise<void>
  onRegisterClick: () => void
  errorMessage: string
}

export function Login({ onLogin, onRegisterClick, errorMessage }: LoginProps) {
  const [loginData, setLoginData] = useState({ role: 'admin' as Role, email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await onLogin(loginData.role, loginData.email, loginData.password)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-card">
      <h1>Rubber Trader Portal</h1>
      <p>Select a user role to continue.</p>
      <div className="form-grid">
        <label>
          Role
          <select value={loginData.role} onChange={(event) => setLoginData({ ...loginData, role: event.target.value as Role })}>
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Email
          <input
            type="email"
            value={loginData.email}
            onChange={(event) => setLoginData({ ...loginData, email: event.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={loginData.password}
            onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
          />
        </label>
      </div>
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      <div className="button-row">
        <button type="button" className="button button-primary" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        <button type="button" className="button button-secondary" onClick={onRegisterClick}>
          Register Customer
        </button>
      </div>
    </main>
  )
}
