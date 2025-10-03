import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedLogo from '../components/AnimatedLogo';
import './SplashScreen.css';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <AnimatedLogo size="large" showText={true} animation="bounce" />
        <div className="loading-indicator">
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <p className="loading-text">Initializing KaiChat...</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;