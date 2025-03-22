import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function CarDetail({ onLogout, user }) {
  const { carId } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [feedImages, setFeedImages] = useState([]);
  const [feedImagePreviews, setFeedImagePreviews] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
    fetch(`http://localhost:5000/cars/${carId}`)
      .then((res) => res.json())
      .then((data) => setCar(data))
      .catch((err) => console.error("Fehler beim Laden der Auto-Details:", err));

    fetch(`http://localhost:5000/cars/${carId}/feed`)
      .then((res) => res.json())
      .then((data) => setFeedPosts(data))
      .catch((err) => console.error("Fehler beim Laden der Feed-Posts:", err));
  }, [carId]);

  const handleFeedImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFeedImages(files);
    setFeedImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleRemovePreview = (index) => {
    const newPreviews = [...feedImagePreviews];
    const newFiles = [...feedImages];
    newPreviews.splice(index, 1);
    newFiles.splice(index, 1);
    setFeedImagePreviews(newPreviews);
    setFeedImages(newFiles);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    let image_url = null;

    if (feedImages.length > 0) {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("file", feedImages[0]);
      try {
        const res = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        image_url = data.filePath;
      } catch (err) {
        console.error("Fehler beim Hochladen des Bildes:", err);
      }
      setUploadingImage(false);
    }

    const payload = { content: newPost, image_url };
    fetch(`http://localhost:5000/cars/${carId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setFeedPosts([data, ...feedPosts]);
        setNewPost("");
        setFeedImages([]);
        setFeedImagePreviews([]);
        setFileInputKey(Date.now());
      })
      .catch((err) => console.error("Fehler beim Posten des Updates:", err));
  };

  const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm("Diesen Beitrag wirklich löschen?");
    if (!confirmDelete) return;

    try {
      await fetch(`http://localhost:5000/cars/${carId}/feed/${postId}`, {
        method: "DELETE",
      });
      setFeedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Fehler beim Löschen des Posts:", err);
    }
  };

  const isVideo = (filename) => {
    return filename && (filename.endsWith(".mp4") || filename.endsWith(".webm") || filename.endsWith(".ogg"));
  };

  if (!car) return <p>Loading...</p>;

  const isOwner = user && user.username === car.username;

  return (
    <div style={{ paddingTop: "4rem", textAlign: "center" }}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "3rem",
          backgroundColor: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
          zIndex: 1000,
        }}
      >
        <button onClick={() => navigate("/")} style={{ padding: "0.4rem 1rem" }}>Zurück</button>
        <span style={{ color: "#fff", fontWeight: "bold" }}>🚗 Car Garage</span>
        {onLogout ? (
          <button onClick={onLogout} style={{ padding: "0.4rem 1rem" }}>Logout</button>
        ) : (
          <div style={{ width: "75px" }}></div>
        )}
      </div>

      <h1 style={{ marginTop: "1rem" }}>Car Garage von {car.username}</h1>

      <h2>
        {car.brand} {car.model}
      </h2>
      <p>Baujahr: {car.year}</p>
      {car.image_url ? (
        <img
          src={`http://localhost:5000/${car.image_url}`}
          alt={`${car.brand} ${car.model}`}
          style={{ maxWidth: "100%", marginBottom: "1rem" }}
        />
      ) : (
        <p>Kein Bild vorhanden.</p>
      )}
      <hr />
      <h3>Update-Feed</h3>

      {isOwner && (
        <form onSubmit={handlePostSubmit} style={{ marginBottom: "1rem" }}>
          {feedImagePreviews.length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              {feedImagePreviews.map((preview, idx) => (
                <div key={idx} style={{ position: "relative", display: "inline-block", margin: "0.5rem" }}>
                  <img
                    src={preview}
                    alt={`Vorschau ${idx + 1}`}
                    style={{ maxWidth: "200px", borderRadius: "8px" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePreview(idx)}
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      backgroundColor: "rgba(0,0,0,0.7)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginBottom: "0.5rem" }}>
            <input
              key={fileInputKey}
              type="file"
              onChange={handleFeedImageChange}
              multiple
            />
          </div>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Text zum Bild oder Video..."
            style={{ width: "100%", height: "80px", marginBottom: "0.5rem" }}
          />
          <button type="submit" style={{ width: "100%", padding: "0.5rem" }}>
            {uploadingImage ? "Datei wird hochgeladen..." : "Posten"}
          </button>
        </form>
      )}

      <div style={{ marginTop: "1rem", textAlign: "left" }}>
        {feedPosts.length > 0 ? (
          feedPosts.map((post) => (
            <div
              key={post.id}
              style={{
                borderBottom: "1px solid #ccc",
                marginBottom: "0.5rem",
                paddingBottom: "0.5rem",
              }}
            >
              {post.image_url && (
                isVideo(post.image_url) ? (
                  <video
                    src={`http://localhost:5000/${post.image_url}`}
                    controls
                    style={{ maxWidth: "100%", marginBottom: "0.5rem" }}
                  />
                ) : (
                  <img
                    src={`http://localhost:5000/${post.image_url}`}
                    alt="Feed"
                    style={{ maxWidth: "100%", marginBottom: "0.5rem" }}
                  />
                )
              )}
              <p>{post.content}</p>
              <small>{post.created_at}</small>
              {isOwner && (
                <div style={{ textAlign: "right" }}>
                  <button onClick={() => handleDeletePost(post.id)} style={{ marginTop: "0.5rem" }}>
                    🗑️ Löschen
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Keine Updates vorhanden.</p>
        )}
      </div>
    </div>
  );
}

export default CarDetail;
