import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VerifyOTPScreen.css';

const VerifyOTPScreen = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a phone number stored
    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) {
      navigate('/login');
    }
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const phoneNumber = localStorage.getItem('phoneNumber');
      if (!phoneNumber) {
        throw new Error('Phone number not found');
      }

      if (otp.length !== 6) {
        throw new Error('Please enter a 6-digit code');
      }

      // First, verify the code
      const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber, code: otp }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || 'Invalid verification code');
      }

      // Code verified successfully, now authenticate the user
      const authResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/phone-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          firebaseUid: `user-${Date.now()}`, // Generate unique Firebase UID
        }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.message || 'Authentication failed');
      }

      localStorage.setItem('token', authData.token);
      const userData = { ...authData };
      delete userData.token;
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('✅ Login successful:', userData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');

    try {
      const phoneNumber = localStorage.getItem('phoneNumber');
      if (!phoneNumber) {
        throw new Error('Phone number not found');
      }

      // Call backend to resend verification code
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification code');
      }

      alert(`Verification code resent to ${phoneNumber}`);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-content">
        <h1 className="verify-title">Enter Code Sent to Your Phone</h1>

        <form onSubmit={handleVerify} className="verify-form">
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              className="verify-input"
              maxLength="6"
            />
          </div>

          <button type="submit" className="verify-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="resend-section">
          <span>Didn't get a code? </span>
          <button
            type="button"
            className="resend-link"
            onClick={handleResend}
            disabled={resendLoading}
          >
            {resendLoading ? 'Sending...' : 'Resend'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPScreen;