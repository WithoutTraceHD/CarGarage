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

const API_URL = import.meta.env.VITE_API_URL;

function AppWrapper() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    navigate("/dashboard");
  };

  const handleLogout = () => {
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
