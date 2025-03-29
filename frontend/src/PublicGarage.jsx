import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const PublicGarage = () => {
  const { userId } = useParams();
  const [garage, setGarage] = useState(null);
  const [cars, setCars] = useState([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        // Username laden
        const userRes = await fetch(`${API_URL}/auth/user/${userId}`);
        const userData = await userRes.json();
        if (userData?.username) setUsername(userData.username);

        // Garage laden
        const garageRes = await fetch(`${API_URL}/garages?user_id=${userId}`);
        const garages = await garageRes.json();
        if (garages.length === 0) return;

        const garage = garages[0];
        setGarage(garage);

        // Autos laden
        const carRes = await fetch(`${API_URL}/garages/${garage.id}/cars`);
        const carsData = await carRes.json();
        setCars(carsData);
      } catch (error) {
        console.error("Fehler beim Laden der öffentlichen Garage:", error);
      }
    };

    fetchData();
  }, [userId]);

  if (!garage) {
    return (
      <p style={{ textAlign: "center", color: "#fff" }}>
        🚗 Garage wird geladen...
      </p>
    );
  }

  return (
    <div style={{ padding: "2rem", color: "#fff" }}>
      <h2 style={{ textAlign: "center" }}>🚘 Öffentliche Garage von {username}</h2>
      <h3 style={{ textAlign: "center", color: "#999" }}>{garage.name}</h3>

      {cars.length > 0 ? (
        <ul>
          {cars.map((car) => (
            <li key={car.id} style={{ marginBottom: "0.5rem" }}>
              {car.brand} {car.model} ({car.year})
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ textAlign: "center" }}>Keine Fahrzeuge vorhanden.</p>
      )}
    </div>
  );
};

export default PublicGarage;
