import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = ({ users = [], isVisible = true }) => {
  if (!isVisible || users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`;
    } else if (users.length === 3) {
      return `${users[0]}, ${users[1]} and ${users[2]} are typing...`;
    } else {
      return `${users[0]}, ${users[1]} and ${users.length - 2} others are typing...`;
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-indicator-content">
        <div className="typing-dots">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
        <span className="typing-text">{getTypingText()}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;