import React, { useState } from 'react'
import { Header, HeaderTab } from '@just-every/demo-ui'

// Note: In a real implementation, you would import Card from your UI library
// For example: import { Card } from '@your-ui-library/components'
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={style}>{children}</div>
)

// Example of how to use the Header component in your application
export const HeaderExample = () => {
  const [activeTab, setActiveTab] = useState('conversation')

  // Define your tabs with optional counts
  const tabs: HeaderTab[] = [
    { id: 'conversation', label: 'Conversation' },
    { id: 'research', label: 'Research' },
    { id: 'inspiration', label: 'Inspiration' },
    { id: 'design', label: 'Design' },
    { id: 'requests', label: 'Requests', count: 5 }, // Example with count
    { id: 'cognition', label: 'Cognition' },
    { id: 'memory', label: 'Memory' }
  ]

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    // You can also update the URL here if needed
    window.history.pushState(null, '', `/${tabId}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header with tabs */}
      <Header 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      {/* Content area */}
      <div style={{ flex: 1, padding: '20px' }}>
        {/* Render content based on activeTab */}
        {activeTab === 'conversation' && <div>Conversation Content</div>}
        {activeTab === 'research' && <div>Research Content</div>}
        {activeTab === 'inspiration' && <div>Inspiration Content</div>}
        {activeTab === 'design' && <div>Design Content</div>}
        {activeTab === 'requests' && <div>Requests Content</div>}
        {activeTab === 'cognition' && <div>Cognition Content</div>}
        {activeTab === 'memory' && <div>Memory Content</div>}
      </div>
    </div>
  )
}

// Example of how to integrate the Header into the existing App.tsx from design/demo
export const IntegrationExample = () => {
  // In your App.tsx, replace the existing tab navigation (lines 584-753) with:
  
  return (
    <Card style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* Use the Header component instead of custom tab buttons */}
      <Header 
        tabs={[
          { id: 'conversation', label: 'Conversation' },
          { id: 'research', label: 'Research' },
          { id: 'inspiration', label: 'Inspiration' },
          { id: 'design', label: 'Design' },
          { id: 'requests', label: 'Requests', count: taskState.llmRequests.length },
          { id: 'cognition', label: 'Cognition' },
          { id: 'memory', label: 'Memory' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      {/* Tab Content (rest of your existing code) */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflow: 'auto',
        minHeight: 0
      }}>
        {/* Your existing tab content rendering logic */}
      </div>
    </Card>
  )
}