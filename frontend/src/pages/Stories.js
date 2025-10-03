import React, { useState, useEffect } from "react";
import axios from "axios";

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [newStory, setNewStory] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch stories/status updates
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem("token");
      // For now, we'll use users' status as stories
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(response.data.filter(user => user.status && user.status !== "Hey there! I'm using KaiChat"));
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const handlePostStory = async () => {
    if (!newStory.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      // Update user's status as their story
      await axios.put(`http://localhost:5000/api/users/${user._id}`, {
        status: newStory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewStory("");
      fetchStories(); // Refresh stories
    } catch (error) {
      console.error("Error posting story:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReact = (storyId, reaction) => {
    // Handle reactions to stories
    console.log(`Reacted ${reaction} to story ${storyId}`);
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#333", marginBottom: "10px" }}>Stories</h1>
        <p style={{ color: "#666", margin: "0" }}>Share what's on your mind</p>
      </div>

      {/* Post New Story */}
      <div style={{
        background: "white",
        borderRadius: "15px",
        padding: "20px",
        marginBottom: "30px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        maxWidth: "600px",
        marginLeft: "auto",
        marginRight: "auto"
      }}>
        <h3 style={{ marginTop: "0", color: "#333" }}>Share your story</h3>
        <textarea
          value={newStory}
          onChange={(e) => setNewStory(e.target.value)}
          placeholder="What's happening?"
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "15px",
            border: "2px solid #e1e5e9",
            borderRadius: "10px",
            fontSize: "16px",
            resize: "vertical",
            outline: "none",
            marginBottom: "15px"
          }}
        />
        <button
          onClick={handlePostStory}
          disabled={loading || !newStory.trim()}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "500",
            opacity: loading || !newStory.trim() ? 0.6 : 1
          }}
        >
          {loading ? "Posting..." : "📝 Post Story"}
        </button>
      </div>

      {/* Stories Feed */}
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ color: "#333", marginBottom: "20px" }}>Recent Stories</h2>

        {stories.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px",
            background: "white",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
          }}>
            <p style={{ color: "#666", margin: "0" }}>No stories yet. Be the first to share!</p>
          </div>
        ) : (
          stories.map((story) => (
            <div key={story._id} style={{
              background: "white",
              borderRadius: "15px",
              padding: "20px",
              marginBottom: "20px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}>
              {/* Story Header */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "white",
                  marginRight: "15px"
                }}>
                  {story.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: "0", color: "#333" }}>{story.fullName}</h4>
                  <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>@{story.username}</p>
                </div>
              </div>

              {/* Story Content */}
              <p style={{
                margin: "0 0 20px 0",
                color: "#333",
                fontSize: "16px",
                lineHeight: "1.5"
              }}>
                {story.status}
              </p>

              {/* Story Actions */}
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <button
                  onClick={() => handleReact(story._id, 'like')}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    border: "1px solid #e1e5e9",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  ❤️ Like
                </button>
                <button
                  onClick={() => handleReact(story._id, 'comment')}
                  style={{
                    padding: "8px 16px",
                    background: "transparent",
                    border: "1px solid #e1e5e9",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  💬 Comment
                </button>
                <span style={{ color: "#666", fontSize: "14px" }}>
                  {new Date(story.updatedAt || story.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Stories;