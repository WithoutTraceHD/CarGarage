import React from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "0.8rem 1.2rem",
        backgroundColor: "#1a1a1a",
        borderBottom: "1px solid #333",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 1000,
      }}
    >
      {/* Zurück-Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          backgroundColor: "transparent",
          color: "#fff",
          border: "none",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        ⬅
      </button>

      {/* Mittiges Logo */}
      <div
        style={{
          fontFamily: "Segoe UI, sans-serif",
          fontWeight: 700,
          fontSize: "1.3rem",
          color: "#ffffff",
          letterSpacing: "1px",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
        }}
      >
        <span style={{ color: "#646cff" }}>🚗 Car</span>
        <span style={{ color: "#ffe599" }}>Garage</span>
      </div>

      {/* Logout */}
      {onLogout ? (
        <button
          onClick={onLogout}
          style={{
            backgroundColor: "#444",
            border: "1px solid #646cff",
            color: "#fff",
            padding: "0.4rem 0.9rem",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      ) : (
        <div style={{ width: "80px" }}></div>
      )}
    </div>
  );
};

export default Header;
