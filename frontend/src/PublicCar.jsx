import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "./components/Header";

const API_URL = import.meta.env.VITE_API_URL;

const PublicCar = () => {
  const { carId } = useParams();
  const [car, setCar] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <>
      <Header />
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", color: "#fff" }}>
        <h1>{car.brand} {car.model}</h1>
        <p>Baujahr: {car.year}</p>

        {/* 🔙 Zurück zur öffentlichen Garage */}
        <p>
          🔗 <Link to={`/public/user/${car.user_id}`}>Zur Garage von {car.username}</Link>
        </p>

        {car.image_url && (
          <img
            src={`${API_URL}/${car.image_url}`}
            alt={car.model}
            onError={(e) => (e.target.style.display = "none")}
            style={{ width: "100%", borderRadius: "10px", marginBottom: "1rem" }}
          />
        )}

        <h2 style={{ marginTop: "2rem" }}>📢 Updates</h2>
        {feed.length === 0 ? (
          <p style={{ color: "#ccc" }}>Keine Updates vorhanden.</p>
        ) : (
          feed.map((post) => (
            <div
              key={post.id}
              style={{
                background: "#1f1f1f",
                padding: "1rem",
                marginBottom: "1.5rem",
                borderRadius: "10px",
                boxShadow: "0 0 5px rgba(0,0,0,0.3)",
              }}
            >
              {post.image_url &&
                (isVideo(post.image_url) ? (
                  <video
                    src={`${API_URL}/${post.image_url}`}
                    controls
                    style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "0.75rem" }}
                  />
                ) : (
                  <img
                    src={`${API_URL}/${post.image_url}`}
                    alt="Update"
                    onError={(e) => (e.target.style.display = "none")}
                    style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "0.75rem" }}
                  />
                ))}

              <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{post.content}</p>
              <small style={{ color: "#888" }}>
                {new Date(post.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default PublicCar;
