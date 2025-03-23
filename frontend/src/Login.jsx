import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, { // <== Hier die Änderung
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Fehler beim Login");
        return;
      }

      onLogin(data.user);
    } catch (error) {
      console.error("❌ Fehler beim Login:", error);
      setError("Netzwerkfehler oder Server nicht erreichbar");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#242424",
        margin: 0,
      }}
    >
      <div
        style={{
          width: "350px",
          backgroundColor: "#333",
          border: "1px solid #444",
          borderRadius: "8px",
          padding: "1.5rem",
          color: "#fff",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ textAlign: "left" }}>
            <label style={{ color: "#fff" }}>E-Mail:</label>
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "#444", color: "#fff", border: "1px solid #555", marginTop: "0.25rem" }}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            <label style={{ color: "#fff" }}>Passwort:</label>
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "#444", color: "#fff", border: "1px solid #555", marginTop: "0.25rem" }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "#444",
              color: "#fff",
              border: "1px solid #555",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          Noch kein Konto?{" "}
          <Link to="/register" style={{ color: "#646cff", textDecoration: "none" }}>
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
