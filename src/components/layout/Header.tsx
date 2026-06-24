import type { Role } from '../../types'
import type { Customer } from '../../types'

interface HeaderProps {
  role: Role | null
  activeCustomer?: Customer
  onLogout: () => void
}

export function Header({ role, activeCustomer, onLogout }: HeaderProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Rubber Trader Platform</p>
        <h1>{role === 'admin' ? 'Admin Dashboard' : role === 'finance' ? 'Finance Dashboard' : 'Customer Portal'}</h1>
      </div>
      <div className="topbar-actions">
        {role && <span className="role-chip">Role: {role}</span>}
        {role === 'customer' && activeCustomer && <span className="role-chip">Customer: {activeCustomer.fullName}</span>}
        <button type="button" className="button button-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
