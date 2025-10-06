import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const Auth = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Demo OTP for testing (replace with Firebase later)
  const DEMO_OTP = "123456";

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

      if (!phoneRegex.test(formattedPhone)) {
        throw new Error("Please enter a valid phone number");
      }

      // Call backend to send verification code
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      // Store phone for verification
      localStorage.setItem('phoneNumber', formattedPhone);

      // Show the verification code for testing
      if (data.code) {
        alert(`Verification code sent to ${formattedPhone}: ${data.code}\n\n(For testing purposes only)`);
      } else {
        alert(`Verification code sent to ${formattedPhone}`);
      }
      setStep("otp");
    } catch (err) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

      if (otp.length !== 6) {
        throw new Error("Please enter a 6-digit code");
      }

      // First, verify the code
      const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone, code: otp }),
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
          phone: formattedPhone,
          firebaseUid: `user-${Date.now()}`, // Generate unique Firebase UID
        }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.message || 'Authentication failed');
      }

      localStorage.setItem("token", authData.token);
      const userData = { ...authData };
      delete userData.token;
      localStorage.setItem("user", JSON.stringify(userData));

      console.log("✅ Login successful:", userData);
      navigate("/");
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Logo */}
      <div className="auth-logo">
        <div className="logo-circle">
          <div className="logo-shape shape-1"></div>
          <div className="logo-shape shape-2"></div>
          <div className="logo-shape shape-3"></div>
        </div>
        <h1 className="app-title">KaiChat</h1>
      </div>

      {/* Form */}
      <form onSubmit={step === "phone" ? handleSendCode : handleVerify} className="auth-form">
        {error && <div className="error-message">{error}</div>}

        {step === "phone" ? (
          <>
            <div className="input-group">
              <input
                type="tel"
                placeholder="Phone Number (e.g. +1234567890)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="auth-input"
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Code"}
            </button>
          </>
        ) : (
          <>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength="6"
                className="auth-input"
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              className="forgot-link"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
            >
              Back to Phone
            </button>
          </>
        )}
      </form>

    </div>
  );
};

export default Auth;
