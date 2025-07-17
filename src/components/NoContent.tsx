import React from 'react'

interface NoContentProps {
  message: string
  title?: string
  icon?: string
  iconFloat?: boolean
}

export const NoContent: React.FC<NoContentProps> = ({ message, title, icon, iconFloat = false }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: title ? '300px' : '150px',
      maxHeight: title ? '700px' : '300px',
      padding: '40px',
      textAlign: 'center'
    }}>
      {icon && <div className={`icon ${iconFloat ? 'float' : ''}`} style={{
        fontSize: '64px',
        marginBottom: '24px',
        opacity: 0.8
      }}>
        {icon}
      </div>}
      {title && <h2>
        {title}
      </h2>}
      <p style={{
        fontSize: '16px',
        color: 'var(--text-secondary)',
        margin: 0,
        maxWidth: '400px',
        lineHeight: '1.5'
      }}>
        {message}
      </p>
    </div>
  )
}