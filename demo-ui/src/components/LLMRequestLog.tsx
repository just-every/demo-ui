import { useState } from 'react'
import { LLMRequestData } from '../utils/llmLogger'
import type { TaskState } from '../hooks/useTaskState'
import { formatDuration } from '../utils/formatters'
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
    return <span className={className}>{status}</span>
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
                  {request.tags.map((tag: string, index: number) => (
                    <span key={tag} className="request-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {requests.length === 0 && (
          <div className="empty-state">
            No LLM requests yet
          </div>
        )}
      </div>

      {selectedRequestData && (
        <div className="request-details">
          <div className="details-header">
            <h3>Request Details - {selectedRequestData.requestId}</h3>
            <button 
              className="close-button"
              onClick={() => setSelectedRequest(null)}
            >
              ×
            </button>
          </div>
          
          <div className="details-content">
            
            {selectedRequestData.errorData ? (
              <div className="detail-section">
                <h4>Error Details</h4>
                <pre className="response-content error">
                  {typeof selectedRequestData.errorData === 'string' 
                    ? selectedRequestData.errorData 
                    : JSON.stringify(selectedRequestData.errorData, null, 2)}
                </pre>
              </div>
            ) : null}

            {selectedRequestData.responseData ? (
              <div className="detail-section">
                <h4>Full Response</h4>
                <pre className="response-content">
                  {typeof selectedRequestData.responseData === 'string' 
                    ? selectedRequestData.responseData 
                    : JSON.stringify(selectedRequestData.responseData, null, 2)}
                </pre>
              </div>
            ) : null}

            <div className="detail-section">
              <h4>Full Request Payload</h4>
              <pre className="response-content">
                {JSON.stringify(selectedRequestData.requestData, null, 2)}
              </pre>
            </div>
            
            <div className="detail-section">
              <h4>Request Metadata</h4>
              <div className="metadata-grid">
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
                      {selectedRequestData.tags.map((tag: string, index: number) => (
                        <span key={tag} className="request-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}