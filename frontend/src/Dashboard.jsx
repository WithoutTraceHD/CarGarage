import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "./components/Header";

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = ({ user, onLogout }) => {
  const [garage, setGarage] = useState(null);
  const [cars, setCars] = useState([]);
  const [activeForAddCar, setActiveForAddCar] = useState(false);
  const [newCar, setNewCar] = useState({ brand: "", model: "", year: "", image_url: "" });

  const [searchType, setSearchType] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`${API_URL}/search/${searchType}?query=${searchQuery}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Fehler bei der Suche:", err);
    }
  };

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
    const payload = { garage_id: garage.id, brand: newCar.brand, model: newCar.model, year: parseInt(newCar.year), image_url: newCar.image_url || null };
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

  if (!garage) return <p className="text-center text-gray-300">Lade Garage...</p>;

  return (
    <div className="pt-16 px-4 max-w-4xl mx-auto">
      <Header onLogout={onLogout} />

      <div className="space-y-8">
        {/* Suchleiste */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <input
            type="text"
            placeholder="Suche nach Benutzer oder Auto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 rounded bg-gray-800 text-white"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="users">Benutzer</option>
            <option value="cars">Autos</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Suchen
          </button>
        </div>

        {/* Suchergebnisse */}
        {searchResults.length > 0 && (
          <div className="bg-gray-900 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Suchergebnisse:</h3>
            <ul className="space-y-1">
              {searchType === "users" &&
                searchResults.map((user) => (
                  <li key={user.id}>
                    👤 {user.username} –{" "}
                    <a href={`/public/user/${user.id}`} className="text-blue-400 hover:underline">
                      Garage ansehen
                    </a>
                  </li>
                ))}
              {searchType === "cars" &&
                searchResults.map((car) => (
                  <li key={car.id}>
                    🚗 {car.brand} {car.model} ({car.year}) –{" "}
                    <strong>von {car.username}</strong> –{" "}
                    <a href={`/public/cars/${car.id}`} className="text-blue-400 hover:underline">
                      Anzeigen
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <h2 className="text-3xl font-bold text-center">Willkommen, {user.username}!</h2>
        <h3 className="text-xl text-center text-gray-400">{garage.name}</h3>

        {cars.length > 0 ? (
          <ul className="space-y-2">
            {cars.map((car) => (
              <li
                key={car.id}
                className="flex justify-between items-center bg-gray-800 p-4 rounded-lg"
              >
                <Link
                  to={`/cars/${car.id}`}
                  className="text-blue-400 hover:underline"
                >
                  {car.brand} {car.model} ({car.year})
                </Link>
                <button
                  onClick={() => handleDeleteCar(car.id)}
                  className="ml-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-400">Keine Autos gefunden.</p>
        )}

        {activeForAddCar ? (
          <form onSubmit={handleAddCarSubmit} className="bg-gray-900 p-6 rounded-lg shadow space-y-4">
            <input
              type="text"
              placeholder="Marke"
              value={newCar.brand}
              onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
              required
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
            <input
              type="text"
              placeholder="Modell"
              value={newCar.model}
              onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
              required
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
            <input
              type="number"
              placeholder="Baujahr"
              value={newCar.year}
              onChange={(e) => setNewCar({ ...newCar, year: e.target.value })}
              required
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
            {newCar.image_url && (
              <p className="text-sm text-green-400">Bild hochgeladen: {newCar.image_url}</p>
            )}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Auto hinzufügen
            </button>
          </form>
        ) : (
          <button
            onClick={() => setActiveForAddCar(true)}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Auto hinzufügen
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
