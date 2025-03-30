import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "./components/Header";

const API_URL = import.meta.env.VITE_API_URL;

const PublicGarage = () => {
  const { userId } = useParams();
  const [garage, setGarage] = useState(null);
  const [cars, setCars] = useState([]);
  const [username, setUsername] = useState("");

  const loggedInUser = sessionStorage.getItem("user");
  const isOwnGarage = loggedInUser && JSON.parse(loggedInUser).id === parseInt(userId);

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

  if (!garage) return <p style={{ textAlign: "center" }}>Garage wird geladen...</p>;

  return (
    <>
      <Header />
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", color: "#fff" }}>
        <h2 style={{ textAlign: "center" }}>🚘 Öffentliche Garage von {username}</h2>

        {/* 🔙 Zurück zur eigenen Garage */}
        {loggedInUser && !isOwnGarage && (
          <p style={{ marginBottom: "2rem", textAlign: "center" }}>
            🔄 <Link to="/dashboard">Zurück zu deiner Garage</Link>
          </p>
        )}

        {cars.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {cars.map((car) => (
              <li
                key={car.id}
                style={{
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#1f1f1f",
                  borderRadius: "10px",
                  boxShadow: "0 0 5px rgba(0,0,0,0.3)",
                }}
              >
                {car.image_url && (
                  <img
                    src={`${API_URL}/${car.image_url}`}
                    alt={car.model}
                    style={{
                      width: "100%",
                      maxHeight: "250px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "0.5rem",
                    }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
                <h3>{car.brand} {car.model} ({car.year})</h3>
                <Link to={`/public/cars/${car.id}`}>🔗 Fahrzeug ansehen</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: "center", color: "#ccc" }}>Keine Fahrzeuge vorhanden.</p>
        )}
      </div>
    </>
  );
};

export default PublicGarage;
