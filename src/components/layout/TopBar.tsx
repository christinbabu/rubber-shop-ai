import { Bell, Moon, Search, Sun, User } from 'lucide-react'

interface TopBarProps {
  userFullName: string
  theme: 'light' | 'dark'
  onThemeToggle: () => void
}

export function TopBar({ userFullName, theme, onThemeToggle }: TopBarProps) {
  return (
    <div className="topnav">
      <div className="brand">
        <div className="brand-mark">RT</div>
        <div>
          <p className="eyebrow muted">Rubber Trader</p>
          <h2>Management</h2>
        </div>
      </div>
      <div className="topnav-actions">
        <label className="search-input">
          <Search size={16} />
          <input type="search" placeholder="Search customers, purchases, products..." />
        </label>
        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button type="button" className="icon-button" aria-label="Toggle theme" onClick={onThemeToggle}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button type="button" className="profile-pill">
          <User size={16} />
          <span>{userFullName ?? 'Guest'}</span>
        </button>
      </div>
    </div>
  )
}
