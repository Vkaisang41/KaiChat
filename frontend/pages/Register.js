import React, { useState } from "react";
import axios from "axios";

function Register() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);

  const sendCode = async () => {
    await axios.post("http://localhost:5000/api/auth/send-code", { phone });
    setStep(2);
  };

  const verifyCode = async () => {
    const res = await axios.post("http://localhost:5000/api/auth/verify-code", { phone, code });
    alert("Verified! Token: " + res.data.token);
  };

  return (
    <div className="register">
      <h1>Register with Phone</h1>
      {step === 1 && (
        <>
          <input
            type="text"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={sendCode}>Send Code</button>
        </>
      )}
      {step === 2 && (
        <>
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={verifyCode}>Verify</button>
        </>
      )}
    </div>
  );
}

export default Register;
