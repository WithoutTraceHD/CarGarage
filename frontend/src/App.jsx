import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import CarDetail from "./CarDetail";

// Wrapper-Komponente, um Navigation beim Logout zu ermöglichen
function AppWrapper() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    navigate("/"); // Zurück zur Startseite
  };

  return (
    <div style={{ padding: "1rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
      <Routes>
        <Route
          path="/"
          element={
            !isLoggedIn ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Dashboard user={user} onLogout={handleLogout} />
            )
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/cars/:carId" element={<CarDetail onLogout={handleLogout} user={user} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

// App-Komponente mit Router
function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
