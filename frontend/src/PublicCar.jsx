import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "./components/Header"; // ✅ Header eingebunden

const API_URL = import.meta.env.VITE_API_URL;

const PublicCar = () => {
  const { carId } = useParams();
  const [car, setCar] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const loggedInUser = JSON.parse(sessionStorage.getItem("user")); // ✅ Benutzer aus Session prüfen

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await fetch(`${API_URL}/cars/${carId}`);
        const data = await res.json();
        setCar(data);
      } catch (err) {
        console.error("Fehler beim Laden des Autos:", err);
      }
    };

    const fetchFeed = async () => {
      try {
        const res = await fetch(`${API_URL}/cars/${carId}/feed`);
        const data = await res.json();
        setFeed(data);
      } catch (err) {
        console.error("Fehler beim Laden des Feeds:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
    fetchFeed();
  }, [carId]);

  const isVideo = (filename) => {
    return filename && (filename.endsWith(".mp4") || filename.endsWith(".webm") || filename.endsWith(".ogg"));
  };

  if (loading) return <p style={{ textAlign: "center" }}>Lade Fahrzeugdaten...</p>;
  if (!car) return <p style={{ textAlign: "center" }}>Fahrzeug nicht gefunden.</p>;

  return (
    <div style={{ paddingTop: "4rem" }}>
      <Header /> {/* ✅ Header oben */}
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", color: "#fff" }}>
        <h1>{car.brand} {car.model}</h1>
        <p>Baujahr: {car.year}</p>
        {car.image_url ? (
          <img
            src={`${API_URL}/${car.image_url}`}
            alt={car.model}
            style={{ width: "100%", borderRadius: "10px", marginBottom: "1rem" }}
            onError={(e) => e.target.style.display = "none"} // Fallback bei kaputtem Bild
          />
        ) : (
          <p>Kein Fahrzeugbild vorhanden.</p>
        )}

        {/* 🔁 Link zur öffentlichen Garage */}
        <Link
          to={`/public/user/${car.user_id}`}
          style={{
            display: "inline-block",
            marginTop: "1rem",
            marginRight: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#646cff",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "5px",
          }}
        >
          Zur Garage von {car.username}
        </Link>

        {/* 🔁 Zurück zur eigenen Garage (nur wenn eingeloggt) */}
        {loggedInUser && (
          <Link
            to="/dashboard"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#444",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "5px",
            }}
          >
            Zurück zur eigenen Garage
          </Link>
        )}

        <h2 style={{ marginTop: "2rem" }}>Updates</h2>
        {feed.length === 0 ? (
          <p>Keine Updates vorhanden.</p>
        ) : (
          feed.map((post) => (
            <div
              key={post.id}
              style={{
                background: "#1a1a1a",
                padding: "1rem",
                marginBottom: "1rem",
                borderRadius: "8px",
              }}
            >
              {post.image_url &&
                (isVideo(post.image_url) ? (
                  <video
                    src={`${API_URL}/${post.image_url}`}
                    controls
                    style={{ maxWidth: "100%", marginBottom: "0.5rem" }}
                  />
                ) : (
                  <img
                    src={`${API_URL}/${post.image_url}`}
                    alt="Update"
                    style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "0.5rem" }}
                    onError={(e) => e.target.style.display = "none"} // Fallback bei Bildfehler
                  />
                ))}
              <p>{post.content}</p>
              <small>{new Date(post.created_at).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PublicCar;
