import { useState, useEffect } from 'react'
import { LLMRequestData } from '../utils/llmLogger'
import type { TaskState } from '../hooks/useTaskState'
import { formatDuration } from '../utils/formatters'
import { NoContent } from './NoContent'
import './LLMRequestLog.scss'

// Support both old interface and new taskState interface
interface LLMRequestLogProps {
  requests?: LLMRequestData[]
  taskState?: TaskState
}

export default function LLMRequestLog({ requests: requestsProp, taskState }: LLMRequestLogProps) {
  // Use taskState.llmRequests if available, otherwise fall back to requests prop
  const requests = taskState?.llmRequests || requestsProp || []
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'request' | 'response' | 'error'>('stats')

  // Reset active tab when a new request is selected
  useEffect(() => {
    setActiveTab('stats')
  }, [selectedRequest])

  const getRequestPreview = (request: any) => {
    if (request?.messages && Array.isArray(request.messages)) {
      const lastUserMsg = [...request.messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        const content = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : JSON.stringify(lastUserMsg.content)
        return content.length > 150 
          ? content.substring(0, 150) + '...'
          : content
      }
      const lastMsg = request.messages[request.messages.length - 1]
      if (lastMsg) {
        const content = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content)
        return content.length > 150
          ? content.substring(0, 150) + '...'
          : content
      }
    }
    
    if (typeof request === 'string') {
      return request.length > 150 
        ? request.substring(0, 150) + '...'
        : request
    }
    
    const requestStr = JSON.stringify(request)
    return requestStr.length > 150
      ? requestStr.substring(0, 150) + '...'
      : requestStr
  }

  const selectedRequestData = selectedRequest 
    ? requests.find(r => r.requestId === selectedRequest)
    : null

  const getStatusBadge = (status: string) => {
    const className = `status-badge ${status}`
    // Display ERROR in all caps for error status, otherwise use the status as-is but uppercase
    const displayText = status.toUpperCase()
    return <span className={className}>{displayText}</span>
  }

  if(requests.length === 0) {
    return <NoContent message="No requests yet." />
  }
  return (
    <div className="llm-request-log">
      <div className="request-list">
        {requests.map((request) => (
          <div
            key={request.requestId}
            className={`request-item ${selectedRequest === request.requestId ? 'selected' : ''} ${request.status}`}
            onClick={() => setSelectedRequest(request.requestId)}
          >
            <div className="request-header">
              <span className="request-model">{request.model}</span>
              <div className="request-meta">
                {getStatusBadge(request.status)}
                <span className="request-time">
                  {new Date(request.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="request-preview">
              {getRequestPreview(request.requestData)}
            </div>
            <div className="request-stats">
              <span>{request.providerName}</span>
              {request.duration !== undefined && (
                <span>{formatDuration(request.duration)}</span>
              )}
              {request.tags && request.tags.length > 0 && (
                <div className="request-tags">
                  {request.tags.map((tag: string) => (
                    <span key={tag} className="request-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedRequestData && (
        <div className="request-details">
          <div className="details-header">
            <h3>Request Details</h3>
            <button 
              className="close-button"
              onClick={() => setSelectedRequest(null)}
            >
              ×
            </button>
          </div>
          
          <div className="details-tabs">
            <button 
              className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Stats
            </button>
            <button 
              className={`tab-button ${activeTab === 'request' ? 'active' : ''}`}
              onClick={() => setActiveTab('request')}
            >
              Request
            </button>
            {!!selectedRequestData.responseData && (
              <button 
                className={`tab-button ${activeTab === 'response' ? 'active' : ''}`}
                onClick={() => setActiveTab('response')}
              >
                Response
              </button>
            )}
            {!!selectedRequestData.errorData && (
              <button 
                className={`tab-button ${activeTab === 'error' ? 'active' : ''}`}
                onClick={() => setActiveTab('error')}
              >
                Error
              </button>
            )}
          </div>
          
          <div className="details-content">
            {activeTab === 'stats' && (
              <div className="tab-content">
                <div className="metadata-grid">
                  <div><strong>Request ID:</strong> {selectedRequestData.requestId}</div>
                  <div><strong>Agent ID:</strong> {selectedRequestData.agentId}</div>
                  <div><strong>Provider:</strong> {selectedRequestData.providerName}</div>
                  <div><strong>Model:</strong> {selectedRequestData.model}</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedRequestData.status)}</div>
                  <div><strong>Timestamp:</strong> {selectedRequestData.timestamp.toLocaleString()}</div>
                  {selectedRequestData.duration !== undefined && (
                    <div><strong>Duration:</strong> {formatDuration(selectedRequestData.duration)}</div>
                  )}
                  {selectedRequestData.tags && selectedRequestData.tags.length > 0 && (
                    <div className="metadata-tags">
                      <strong>Tags:</strong>
                      <div className="request-tags">
                        {selectedRequestData.tags.map((tag: string) => (
                          <span key={tag} className="request-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'request' && (
              <div className="tab-content">
                <pre className="response-content">
                  {JSON.stringify(selectedRequestData.requestData, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === 'response' && !!selectedRequestData.responseData && (
              <div className="tab-content">
                <pre className="response-content">
                  {typeof selectedRequestData.responseData === 'string' 
                    ? selectedRequestData.responseData 
                    : JSON.stringify(selectedRequestData.responseData, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === 'error' && !!selectedRequestData.errorData && (
              <div className="tab-content">
                <pre className="response-content error">
                  {typeof selectedRequestData.errorData === 'string' 
                    ? selectedRequestData.errorData 
                    : JSON.stringify(selectedRequestData.errorData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}