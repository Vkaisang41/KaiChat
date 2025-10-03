import React from 'react';
import './AnimatedLogo.css';

const AnimatedLogo = ({ size = 'large', showText = true, animation = 'bounce' }) => {
  return (
    <div className={`animated-logo ${size} ${animation}`}>
      <div className="logo-container">
        <div className="logo-icon">
          <div className="logo-circle">
            <span className="logo-emoji">💬</span>
          </div>
          <div className="logo-pulse"></div>
        </div>
        {showText && (
          <div className="logo-text">
            <h1 className="app-name gradient-text">KaiChat</h1>
            <p className="app-tagline">Connect with the world instantly</p>
          </div>
        )}
      </div>
      <div className="logo-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
    </div>
  );
};

export default AnimatedLogo;