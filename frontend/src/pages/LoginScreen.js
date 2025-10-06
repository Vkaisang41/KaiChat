import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      if (!phoneRegex.test(formattedPhone)) {
        throw new Error('Please enter a valid phone number');
      }

      // Call backend to send verification code
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('Frontend API URL:', apiUrl);
      const fullUrl = `${apiUrl}/api/auth/send-code`;
      console.log('Full request URL:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      // Store phone for next screen
      localStorage.setItem('phoneNumber', formattedPhone);

      // Show the verification code for testing
      if (data.code) {
        alert(`Verification code for ${formattedPhone}: ${data.code}\n\n(For testing purposes only)`);
      } else {
        alert(`Verification code sent to ${formattedPhone}`);
      }

      navigate('/verify-otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <h1 className="login-title">Welcome to KaiChat</h1>
        <p className="login-subtitle">Connect with the world instantly.</p>

        <form onSubmit={handleSendCode} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <input
              type="tel"
              placeholder="+2547xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="login-input"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Code'}
            <span className="btn-icon">📲</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;