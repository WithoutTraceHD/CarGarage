import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.status === 201) {
        setSuccessMessage(data.message);
        setError("");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(data.message);
        setSuccessMessage("");
      }
    } catch (err) {
      setError("Fehler beim Registrieren");
      setSuccessMessage("");
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
        <h2 style={{ marginTop: 0 }}>Registrierung</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ textAlign: "left" }}>
            <label style={{ color: "#fff" }}>Benutzername:</label>
            <br />
            <input
              type="text"
              placeholder="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "#444", color: "#fff", border: "1px solid #555", marginTop: "0.25rem" }}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            <label style={{ color: "#fff" }}>E-Mail:</label>
            <br />
            <input
              type="email"
              placeholder="E-Mail"
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
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", backgroundColor: "#444", color: "#fff", border: "1px solid #555", marginTop: "0.25rem" }}
            />
          </div>
          <button type="submit" style={{ width: "100%", padding: "0.5rem", backgroundColor: "#444", color: "#fff", border: "1px solid #555", cursor: "pointer" }}>
            Registrieren
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          Hast du schon ein Konto? <a href="/" style={{ color: "#646cff", textDecoration: "none" }}>Zum Login</a>
        </p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      </div>
    </div>
  );
};

export default Register;
