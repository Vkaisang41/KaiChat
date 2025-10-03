import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Navbar from "./components/Navbar";
import BottomNavigation from "./components/BottomNavigation";
import SplashScreen from "./pages/SplashScreen";
import LoginScreen from "./pages/LoginScreen";
import VerifyOTPScreen from "./pages/VerifyOTPScreen";
import ChatHomeScreen from "./pages/Home";
// import NewChatScreen from "./pages/NewChatScreen";
import Settings from "./pages/Settings";

function AppContent() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Logged in as", user.phoneNumber);
        setFirebaseUser(user);
      } else {
        console.log("⛔ Not logged in");
        setFirebaseUser(null);
      }
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  // If authenticated, show main app
  if (isAuthenticated) {
    return (
      <>
        <Navbar />
        <div style={{ paddingBottom: "80px" }}>
          <Routes>
            <Route path="/" element={<ChatHomeScreen />} />
            {/* <Route path="/new-chat" element={<NewChatScreen />} /> */}
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <BottomNavigation />
      </>
    );
  }

  // Unauthenticated flow
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/verify-otp" element={<VerifyOTPScreen />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
