import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../firebase";
import "./Settings.css";

function Settings() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4A00E0");
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userDataString = localStorage.getItem("user");
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUser(userData);
        setStatus(userData.status || "");
        setUsername(userData.username || "");
        setFullName(userData.fullName || userData.name || "");
        setProfilePicture(userData.photoURL || userData.profilePicture || null);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleStatusUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5000/api/users/profile", { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleProfileUpdate = async () => {
    if (!username.trim() || !fullName.trim()) {
      alert("Username and full name are required");
      return;
    }

    setUpdatingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put("http://localhost:5000/api/users/profile", {
        username: username.trim(),
        fullName: fullName.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local storage
      const updatedUser = { ...user, username: username.trim(), fullName: fullName.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response?.status === 400) {
        alert(error.response.data.message || "Username already exists or invalid data");
      } else {
        alert("Failed to update profile");
      }
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const userId = localStorage.getItem('userId') || 'demo-user';
      const storageRef = ref(storage, `profile-pictures/${userId}/${file.name}`);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update user profile in Firestore
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: new Date()
      });

      // Update local state
      setProfilePicture(downloadURL);

      // Update localStorage
      const updatedUser = { ...user, photoURL: downloadURL };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("phoneNumber");
    localStorage.removeItem("contactsPermission");
    navigate("/");
  };

  if (!user) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-content">
        <h1 className="settings-title">Settings</h1>

        {/* Profile Section */}
        <div className="settings-section">
          <h2 className="section-title">Profile</h2>
          <div className="profile-info">
            <div className="profile-avatar">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" />
              ) : (
                <span>👤</span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="profile-picture-input"
                disabled={uploading}
              />
              {uploading && <div className="upload-overlay">Uploading...</div>}
            </div>
            <div className="profile-details">
              <div className="profile-name">{user.fullName || user.name || "User"}</div>
              <div className="profile-phone">{user.phone}</div>
              <div className="profile-username">@{user.username || "username"}</div>
            </div>
          </div>
        </div>

        {/* Username & Name Section */}
        <div className="settings-section">
          <h2 className="section-title">Profile Information</h2>
          <p className="section-subtitle">Update your display name and username</p>
          
          <div className="profile-input-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name..."
              className="profile-input"
              maxLength="50"
            />
          </div>

          <div className="profile-input-group">
            <label htmlFor="username">Username</label>
            <div className="username-input-wrapper">
              <span className="username-prefix">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="Enter your username..."
                className="profile-input username-input"
                maxLength="30"
              />
            </div>
            <small className="input-hint">Username can only contain lowercase letters, numbers, and underscores</small>
          </div>

          <button
            onClick={handleProfileUpdate}
            className="profile-update-btn"
            disabled={updatingProfile || !username.trim() || !fullName.trim()}
          >
            {updatingProfile ? "Updating..." : "Update Profile"}
          </button>
        </div>

        {/* Status Section */}
        <div className="settings-section">
          <h2 className="section-title">Status</h2>
          <p className="section-subtitle">What's on your mind?</p>
          <div className="status-input-group">
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Enter your status..."
              className="status-input"
            />
            <button onClick={handleStatusUpdate} className="status-update-btn">
              Update
            </button>
          </div>
        </div>

        {/* Theme Picker Section */}
        <div className="settings-section">
          <h2 className="section-title">Theme</h2>
          <p className="section-subtitle">Choose your primary color</p>
          <div className="color-picker">
            <div className="color-options">
              <button
                className={`color-option ${primaryColor === "#4A00E0" ? "active" : ""}`}
                style={{ backgroundColor: "#4A00E0" }}
                onClick={() => setPrimaryColor("#4A00E0")}
              ></button>
              <button
                className={`color-option ${primaryColor === "#8E2DE2" ? "active" : ""}`}
                style={{ backgroundColor: "#8E2DE2" }}
                onClick={() => setPrimaryColor("#8E2DE2")}
              ></button>
              <button
                className={`color-option ${primaryColor === "#FF6F00" ? "active" : ""}`}
                style={{ backgroundColor: "#FF6F00" }}
                onClick={() => setPrimaryColor("#FF6F00")}
              ></button>
              <button
                className={`color-option ${primaryColor === "#2196F3" ? "active" : ""}`}
                style={{ backgroundColor: "#2196F3" }}
                onClick={() => setPrimaryColor("#2196F3")}
              ></button>
            </div>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="settings-section">
          <h2 className="section-title">Privacy & Security</h2>
          <div className="privacy-options">
            <div className="privacy-option">
              <span>Block contacts</span>
              <button className="option-btn">Manage</button>
            </div>
            <div className="privacy-option">
              <span>Two-factor authentication</span>
              <button className="option-btn">Enable</button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="settings-section">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;