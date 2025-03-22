import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const PublicCar = () => {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await fetch(`${API_URL}/cars/${id}`);
        const data = await res.json();
        setCar(data);
      } catch (err) {
        console.error("Fehler beim Laden des Autos:", err);
      }
    };

    const fetchFeed = async () => {
      try {
        const res = await fetch(`${API_URL}/cars/${id}/feed`);
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
  }, [id]);

  if (loading) return <p style={{ textAlign: "center" }}>Lade Fahrzeugdaten...</p>;
  if (!car) return <p style={{ textAlign: "center" }}>Fahrzeug nicht gefunden.</p>;

  const isVideo = (filename) => {
    return filename && (filename.endsWith(".mp4") || filename.endsWith(".webm") || filename.endsWith(".ogg"));
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>{car.brand} {car.model}</h1>
      <p>Baujahr: {car.year}</p>
      {car.image_url && (
        <img
          src={`${API_URL}/${car.image_url}`}
          alt={car.model}
          style={{ width: "100%", borderRadius: "10px", marginBottom: "1rem" }}
        />
      )}

      <h2>Updates</h2>
      {feed.length === 0 ? (
        <p>Keine Updates vorhanden.</p>
      ) : (
        feed.map(post => (
          <div
            key={post.id}
            style={{
              background: "#1a1a1a",
              padding: "1rem",
              marginBottom: "1rem",
              borderRadius: "8px"
            }}
          >
            {post.image_url && (
              isVideo(post.image_url) ? (
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
                />
              )
            )}
            <p>{post.content}</p>
            <small>{new Date(post.created_at).toLocaleString()}</small>
          </div>
        ))
      )}
    </div>
  );
};

export default PublicCar;
