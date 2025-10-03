import React from 'react';
import './MessageStatus.css';

const MessageStatus = ({ 
  status = 'sent', 
  timestamp, 
  readBy = [], 
  showTimestamp = true,
  size = 'small' 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="status-sending">
            <div className="sending-spinner"></div>
          </div>
        );
      case 'sent':
        return <span className="status-icon status-sent">✓</span>;
      case 'delivered':
        return <span className="status-icon status-delivered">✓✓</span>;
      case 'read':
        return <span className="status-icon status-read">✓✓</span>;
      case 'failed':
        return <span className="status-icon status-failed">⚠</span>;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getReadByText = () => {
    if (!readBy || readBy.length === 0) return '';
    
    if (readBy.length === 1) {
      return `Read by ${readBy[0].name || readBy[0].user}`;
    } else if (readBy.length === 2) {
      return `Read by ${readBy[0].name || readBy[0].user} and ${readBy[1].name || readBy[1].user}`;
    } else {
      return `Read by ${readBy[0].name || readBy[0].user} and ${readBy.length - 1} others`;
    }
  };

  return (
    <div className={`message-status ${size}`}>
      <div className="status-content">
        {getStatusIcon()}
        {showTimestamp && timestamp && (
          <span className="status-timestamp">
            {formatTimestamp(timestamp)}
          </span>
        )}
      </div>
      {status === 'read' && readBy && readBy.length > 0 && (
        <div className="read-by-info">
          <span className="read-by-text">{getReadByText()}</span>
          <div className="read-by-avatars">
            {readBy.slice(0, 3).map((reader, index) => (
              <div key={index} className="read-by-avatar">
                {reader.avatar || reader.profilePicture ? (
                  <img 
                    src={reader.avatar || reader.profilePicture} 
                    alt={reader.name || reader.user}
                  />
                ) : (
                  <span>{(reader.name || reader.user || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
            ))}
            {readBy.length > 3 && (
              <div className="read-by-avatar read-by-more">
                +{readBy.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageStatus;