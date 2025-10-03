import React, { useEffect, useState } from "react";

function Chat() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const fetchUser = async () => {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data);
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
      <h2>Chat Page</h2>
      {user ? <p>Welcome, {user.username}!</p> : <p>Loading user...</p>}
    </div>
  );
}

export default Chat;
