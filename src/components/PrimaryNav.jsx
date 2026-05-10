import { navItems } from './navigation'

export function PrimaryNav({ activeTab, onChangeTab }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.key

        return (
          <button
            key={item.key}
            type="button"
            className={isActive ? 'bottom-nav-button active' : 'bottom-nav-button'}
            onClick={() => onChangeTab(item.key)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
