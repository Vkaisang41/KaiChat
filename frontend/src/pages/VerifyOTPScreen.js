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

      // Demo verification
      if (otp !== '123456') {
        throw new Error('Invalid verification code');
      }

      // Call backend to register/login with demo data
      const res = await axios.post('http://localhost:5000/api/auth/phone-auth', {
        phone: phoneNumber,
        firebaseUid: `demo-${Date.now()}`, // Demo UID
      });

      localStorage.setItem('token', res.data.token);
      const userData = { ...res.data };
      delete userData.token;
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('✅ Demo login successful:', userData);
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

      // Demo resend
      console.log(`📱 Demo: SMS code "123456" resent to ${phoneNumber}`);
      alert(`Demo: SMS code "123456" resent to ${phoneNumber}`);
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