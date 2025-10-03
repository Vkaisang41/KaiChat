import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: "🏠",
      path: "/",
      color: "#FF6B6B" // Red
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙️",
      path: "/settings",
      color: "#96CEB4" // Green
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "white",
      borderTop: "1px solid #e1e5e9",
      padding: "10px 0",
      boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
      zIndex: 1000
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        maxWidth: "400px",
        margin: "0 auto"
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                minWidth: "60px",
                position: "relative"
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: "absolute",
                  top: "-8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "40px",
                  height: "3px",
                  background: item.color,
                  borderRadius: "2px"
                }} />
              )}

              {/* Icon */}
              <span style={{
                fontSize: "20px",
                marginBottom: "4px",
                filter: isActive ? "none" : "grayscale(100%)",
                transition: "filter 0.2s ease"
              }}>
                {item.icon}
              </span>

              {/* Label */}
              <span style={{
                fontSize: "12px",
                fontWeight: isActive ? "600" : "400",
                color: isActive ? item.color : "#666",
                transition: "all 0.2s ease"
              }}>
                {item.label}
              </span>

              {/* Active background */}
              {isActive && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "50px",
                  height: "50px",
                  background: `${item.color}20`,
                  borderRadius: "12px",
                  zIndex: -1
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;