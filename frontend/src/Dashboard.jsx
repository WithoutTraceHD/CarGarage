import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = ({ user, onLogout }) => {
  const [garage, setGarage] = useState(null);
  const [cars, setCars] = useState([]);
  const [activeForAddCar, setActiveForAddCar] = useState(false);
  const [newCar, setNewCar] = useState({ brand: "", model: "", year: "", image_url: "" });

  useEffect(() => {
    if (!user || !user.id) return;

    fetch(`${API_URL}/garages?user_id=${user.id}`)
      .then((res) => res.json())
      .then(async (garages) => {
        if (garages.length === 0) return;

        const userGarage = garages[0];
        setGarage(userGarage);

        const resCars = await fetch(`${API_URL}/garages/${userGarage.id}/cars`);
        const carsData = await resCars.json();
        setCars(carsData);
      })
      .catch((err) => console.error("Fehler beim Laden der Garage:", err));
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    fetch(`${API_URL}/upload`, { method: "POST", body: formData })
      .then((res) => res.json())
      .then((data) => {
        setNewCar((prev) => ({ ...prev, image_url: data.filePath }));
      })
      .catch((err) => console.error("Upload error:", err));
  };

  const handleAddCarSubmit = (e) => {
    e.preventDefault();
    if (!garage) return;

    const payload = {
      garage_id: garage.id,
      brand: newCar.brand,
      model: newCar.model,
      year: parseInt(newCar.year),
      image_url: newCar.image_url || null,
    };

    fetch(`${API_URL}/cars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((createdCar) => {
        setCars((prev) => [...prev, createdCar]);
        setNewCar({ brand: "", model: "", year: "", image_url: "" });
        setActiveForAddCar(false);
      })
      .catch((err) => console.error("Fehler beim Hinzufügen des Autos:", err));
  };

  const handleDeleteCar = (carId) => {
    fetch(`${API_URL}/cars/${carId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Fehler beim Löschen des Autos");
        setCars((prev) => prev.filter((c) => c.id !== carId));
      })
      .catch((err) => console.error(err));
  };

  if (!garage) {
    return <p>Lade Garage...</p>;
  }

  return (
    <div style={{ padding: "1rem", position: "relative" }}>
      {/* 🔝 Top-Bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "1rem",
          backgroundColor: "#1a1a1a",
          borderBottom: "1px solid #333",
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 100,
        }}
      >
        {onLogout && (
          <button onClick={onLogout} style={{ padding: "0.5rem 1rem" }}>
            Logout
          </button>
        )}
      </div>

      {/* Platz unter Top-Bar */}
      <div style={{ marginTop: "4rem" }}>
        <h2>Willkommen, {user.username}!</h2>
        <h3>{garage.name}</h3>

        {cars.length > 0 ? (
          <ul>
            {cars.map((car) => (
              <li
                key={car.id}
                style={{
                  marginBottom: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Link
                  to={`/cars/${car.id}`}
                  style={{ textDecoration: "none", color: "#646cff" }}
                >
                  {car.brand} {car.model} ({car.year})
                </Link>
                <button
                  onClick={() => handleDeleteCar(car.id)}
                  style={{
                    marginLeft: "1rem",
                    backgroundColor: "#ff4d4d",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Keine Autos gefunden.</p>
        )}

        {activeForAddCar ? (
          <form onSubmit={handleAddCarSubmit} style={{ marginTop: "1rem" }}>
            <input
              type="text"
              placeholder="Marke"
              value={newCar.brand}
              onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
              required
              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
            />
            <input
              type="text"
              placeholder="Modell"
              value={newCar.model}
              onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
              required
              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
            />
            <input
              type="number"
              placeholder="Baujahr"
              value={newCar.year}
              onChange={(e) => setNewCar({ ...newCar, year: e.target.value })}
              required
              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
            />
            <input
              type="file"
              onChange={handleFileChange}
              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
            />
            {newCar.image_url && (
              <p style={{ fontSize: "0.9rem", color: "#646cff" }}>
                Bild hochgeladen: {newCar.image_url}
              </p>
            )}
            <button type="submit" style={{ width: "100%", padding: "0.5rem" }}>
              Auto hinzufügen
            </button>
          </form>
        ) : (
          <button
            onClick={() => setActiveForAddCar(true)}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              backgroundColor: "#646cff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Auto hinzufügen
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
