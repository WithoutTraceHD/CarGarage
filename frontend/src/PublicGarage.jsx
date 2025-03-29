import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const PublicGarage = () => {
  const { userId } = useParams();
  const [garage, setGarage] = useState(null);
  const [cars, setCars] = useState([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!userId) return;

    // Username laden
    fetch(`${API_URL}/auth/user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.username) setUsername(data.username);
      });

    // Garage + Autos laden
    fetch(`${API_URL}/garages?user_id=${userId}`)
      .then((res) => res.json())
      .then(async (garages) => {
        if (garages.length === 0) return;
        const garage = garages[0];
        setGarage(garage);

        const resCars = await fetch(`${API_URL}/garages/${garage.id}/cars`);
        const carsData = await resCars.json();
        setCars(carsData);
      });
  }, [userId]);

  if (!garage) return <p style={{ textAlign: "center" }}>🚗 Garage wird geladen...</p>;

  return (
    <div style={{ padding: "2rem", color: "#fff" }}>
      <h2 style={{ textAlign: "center" }}>🚗 Öffentliche Garage von {username}</h2>

      {cars.length > 0 ? (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {cars.map((car) => (
            <li key={car.id} style={{ marginBottom: "0.5rem" }}>
              <Link
                to={`/public/cars/${car.id}`}
                style={{ color: "#646cff", textDecoration: "none" }}
              >
                {car.brand} {car.model} ({car.year})
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Keine Fahrzeuge vorhanden.</p>
      )}
    </div>
  );
};

export default PublicGarage;
