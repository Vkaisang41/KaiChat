import React, { useState, useEffect } from "react";
import axios from "axios";

const Explore = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all users for discovery
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleChat = (userId) => {
    // Navigate to chat with this user
    console.log("Start chat with user:", userId);
  };

  const handleFollow = (userId) => {
    // Follow/unfollow user
    console.log("Follow user:", userId);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>Discover People</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {users.map((user) => (
          <div key={user._id} style={{
            background: "white",
            borderRadius: "15px",
            padding: "20px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            transition: "transform 0.2s ease",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-5px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
          >
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                margin: "0 auto 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                color: "white"
              }}>
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: "5px 0", color: "#333" }}>{user.fullName}</h3>
              <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>@{user.username}</p>
              {user.status && (
                <p style={{ margin: "10px 0", color: "#555", fontStyle: "italic", fontSize: "14px" }}>
                  "{user.status}"
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => handleChat(user._id)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                💬 Chat
              </button>
              <button
                onClick={() => handleFollow(user._id)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  background: "transparent",
                  color: "#667eea",
                  border: "2px solid #667eea",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                ➕ Follow
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;