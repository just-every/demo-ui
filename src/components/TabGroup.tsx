import React from 'react';
import './style.scss';

export interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export interface TabGroupProps {
    /** Array of tabs */
    tabs: Tab[];
    /** Currently active tab ID */
    activeTab: string;
    /** Tab change handler */
    onChange: (tabId: string) => void;
    /** Tab variant */
    variant?: 'default' | 'underline' | 'pills';
    /** Tab size */
    size?: 'small' | 'medium' | 'large';
    /** Full width tabs */
    fullWidth?: boolean;
    /** Custom className */
    className?: string;
}

export const TabGroup: React.FC<TabGroupProps> = ({
    tabs,
    activeTab,
    onChange,
    variant = 'underline',
    size = 'medium',
    fullWidth = false,
    className = ''
}) => {
    return (
        <div 
            className={`tab-group ${variant} ${size} ${fullWidth ? 'full-width' : ''} ${className}`}
            role="tablist"
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => !tab.disabled && onChange(tab.id)}
                    disabled={tab.disabled}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`tabpanel-${tab.id}`}
                >
                    {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                    <span className="tab-label">{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export interface TabPanelProps {
    /** Tab ID this panel belongs to */
    tabId: string;
    /** Currently active tab ID */
    activeTab: string;
    /** Panel content */
    children: React.ReactNode;
    /** Keep mounted when inactive */
    keepMounted?: boolean;
    /** Custom className */
    className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
    tabId,
    activeTab,
    children,
    keepMounted = false,
    className = ''
}) => {
    const isActive = activeTab === tabId;
    
    if (!isActive && !keepMounted) {
        return null;
    }

    return (
        <div
            id={`tabpanel-${tabId}`}
            role="tabpanel"
            className={`tab-panel ${className}`}
            style={{ display: isActive ? 'block' : 'none' }}
            aria-hidden={!isActive}
        >
            {children}
        </div>
    );
};