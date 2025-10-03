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

      // Simulate sending SMS (replace with Firebase later)
      console.log(`📱 Demo: SMS sent to ${formattedPhone}`);
      alert(`Demo: SMS code "${DEMO_OTP}" sent to ${formattedPhone}`);

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
      // Demo verification (replace with Firebase later)
      if (otp !== DEMO_OTP) {
        throw new Error("Invalid verification code");
      }

      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

      // Call backend to register/login with demo data
      const res = await axios.post("http://localhost:5000/api/auth/phone-auth", {
        phone: formattedPhone,
        firebaseUid: `demo-${Date.now()}`, // Demo UID
      });

      localStorage.setItem("token", res.data.token);
      const userData = { ...res.data };
      delete userData.token;
      localStorage.setItem("user", JSON.stringify(userData));

      console.log("✅ Demo login successful:", userData);
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

      {/* Demo mode indicator */}
      <div style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>
        🔧 Demo Mode - Use code: 123456
      </div>
    </div>
  );
};

export default Auth;
