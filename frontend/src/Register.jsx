import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;
  console.log("🌐 Aktive API_URL:", API_URL);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setError(data.errors.map((err) => err.msg).join(", "));
        } else {
          setError(data.message || "Registrierung fehlgeschlagen");
        }
        return;
      }
      navigate('/');
    } catch (error) {
      console.error("❌ Fehler bei der Registrierung:", error);
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
        <h2 style={{ marginTop: 0 }}>Registrieren</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <input
            name="username"
            type="text"
            placeholder="Benutzername"
            value={form.username}
            onChange={handleChange}
            required
            style={{ padding: "0.5rem", backgroundColor: "#444", color: "#fff", border: "1px solid #555" }}
          />
          <input
            name="email"
            type="email"
            placeholder="E-Mail"
            value={form.email}
            onChange={handleChange}
            required
            style={{ padding: "0.5rem", backgroundColor: "#444", color: "#fff", border: "1px solid #555" }}
          />
          <input
            name="password"
            type="password"
            placeholder="Passwort"
            value={form.password}
            onChange={handleChange}
            required
            style={{ padding: "0.5rem", backgroundColor: "#444", color: "#fff", border: "1px solid #555" }}
          />
          <button type="submit" style={{ padding: "0.5rem", backgroundColor: "#444", color: "#fff", border: "1px solid #555", cursor: "pointer" }}>
            Registrieren
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          Bereits registriert? <Link to="/" style={{ color: "#646cff", textDecoration: "none" }}>Zum Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
