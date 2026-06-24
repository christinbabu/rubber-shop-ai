import type { Role } from '../../types'
import { getNavItems } from '../../utils/constants'

interface SidebarProps {
  role: Role | null
  activeTab: string
  onTabChange: (tabId: string) => void
  navPinned: boolean
  onToggleNav: () => void
}

export function Sidebar({ role, activeTab, onTabChange }: SidebarProps) {
  const navItems = getNavItems(role)

  return (
    <aside className="sidebar sidebar-open">
      <div className="sidebar-header">
        <strong>Navigation</strong>
      </div>
      <nav className="nav-list">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
