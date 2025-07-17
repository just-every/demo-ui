import React from 'react'
import './Header.scss'

export interface HeaderTab {
  id: string
  label: string
  count?: number
}

export interface HeaderProps {
  tabs: HeaderTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export const Header: React.FC<HeaderProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`header-navigation ${className}`}>
      <div className="header-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="header-tab-label">{tab.label}</span>
            {tab.count !== undefined && (
              <span className="header-tab-count">({tab.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Header