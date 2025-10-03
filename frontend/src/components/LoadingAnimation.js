import React from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ message = "Loading...", size = "medium" }) => {
  return (
    <div className={`loading-animation ${size}`}>
      <div className="loading-spinner-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingAnimation;