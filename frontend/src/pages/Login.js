import React, { useState } from "react";
import axios from "axios";

function Login() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const sendCode = async () => {
    setError("");
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/phone-auth`, { phone });
      setStep(2);
    } catch (err) {
      setError("Network Error");
    }
  };

  const verifyCode = async () => {
    setError("");
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/verify-code`, { phone, code });
      // handle successful login (e.g., redirect or set user)
    } catch (err) {
      setError("Invalid code or network error");
    }
  };

  return (
    <div className="login">
      <h2 className="animation" style={{ "--i": 1 }}>Login Page</h2>
      {step === 1 ? (
        <>
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="animation"
            style={{ "--i": 2 }}
          />
          <button className="btn animation" style={{ "--i": 3 }} onClick={sendCode}>
            Continue
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter code sent to your phone"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="animation"
            style={{ "--i": 2 }}
          />
          <button className="btn animation" style={{ "--i": 3 }} onClick={verifyCode}>
            Verify
          </button>
          <button className="btn animation" style={{ "--i": 4 }} onClick={() => setStep(1)}>
            Resend Code
          </button>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Login;
