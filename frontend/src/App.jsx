import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import CarDetail from "./CarDetail";
import PublicCar from "./PublicCar";
import PublicGarage from "./PublicGarage"; // ✅ NEU

const API_URL = import.meta.env.VITE_API_URL;

function AppWrapper() {
  const navigate = useNavigate();

  // ✅ Statt localStorage jetzt sessionStorage verwenden
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  const handleLogin = (userData) => {
    sessionStorage.setItem("user", JSON.stringify(userData)); // ✅ neu
    setUser(userData);
    setIsLoggedIn(true);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user"); // ✅ neu
    setUser(null);
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div
      style={{
        padding: "1rem",
        textAlign: "center",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <Routes>
        <Route
          path="/"
          element={
            !isLoggedIn ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />
          }
        />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />
          }
        />
        <Route
          path="/cars/:carId"
          element={<CarDetail onLogout={handleLogout} user={user} />}
        />
        <Route path="/public/cars/:carId" element={<PublicCar />} />
        <Route path="/public/user/:userId" element={<PublicGarage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
