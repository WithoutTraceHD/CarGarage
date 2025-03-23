require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const db = require("./db");
const multer = require("multer");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// QR-Code Router importieren
const qrRouter = require("./routes/qr");
// Auth Router importieren
const authRouter = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

const PORT = 5000;

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Router einbinden
app.use("/send-qr", qrRouter);
app.use("/auth", authRouter);

// Begrüßungsroute
app.get("/", (req, res) => {
  res.json({ message: "Willkommen bei der CarGarage-API!" });
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Keine Datei hochgeladen" });
  }
  const normalizedPath = req.file.path.replace(/\\/g, "/");
  res.status(201).json({
    message: "Datei erfolgreich hochgeladen",
    filePath: normalizedPath,
  });
});

// GET Garagen
app.get("/garages", (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) {
    return res.status(400).json({ message: "user_id fehlt" });
  }

  const query = "SELECT * FROM garages WHERE user_id = ?";
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error("❌ Fehler beim Laden der Garage:", err);
      return res.status(500).json({ message: "Datenbankfehler" });
    }
    res.json(results);
  });
});

// GET Autos einer Garage
app.get("/garages/:garageId/cars", (req, res) => {
  const garageId = req.params.garageId;
  const query = "SELECT * FROM cars WHERE garage_id = ?";
  db.query(query, [garageId], (err, results) => {
    if (err) {
      console.error("❌ Fehler beim Laden der Autos:", err);
      return res.status(500).json({ message: "Datenbankfehler" });
    }
    res.json(results);
  });
});

// GET Auto + Besitzer
app.get("/cars/:carId", (req, res) => {
  const { carId } = req.params;
  const query = `
    SELECT cars.*, users.username 
    FROM cars
    JOIN garages ON cars.garage_id = garages.id
    JOIN users ON garages.user_id = users.id
    WHERE cars.id = ?
  `;
  db.query(query, [carId], (err, results) => {
    if (err) {
      console.error("❌ Fehler beim Abrufen des Autos:", err);
      return res.status(500).json({ message: "Datenbankfehler" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Auto nicht gefunden" });
    }
    res.json(results[0]);
  });
});

// POST Auto hinzufügen
app.post("/cars", (req, res) => {
  const { garage_id, brand, model, year, image_url } = req.body;
  if (!garage_id || !brand || !model || !year) {
    return res.status(400).json({ message: "Fehlende Felder für das Fahrzeug" });
  }
  const query = `
    INSERT INTO cars (garage_id, brand, model, year, image_url)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [garage_id, brand, model, year, image_url], (err, result) => {
    if (err) {
      console.error("❌ Fehler beim Hinzufügen des Autos:", err);
      return res.status(500).json({ message: "Fehler beim Speichern in der Datenbank" });
    }
    const newCarId = result.insertId;
    db.query("SELECT * FROM cars WHERE id = ?", [newCarId], (err2, rows) => {
      if (err2) {
        console.error("❌ Fehler beim Abrufen des neuen Autos:", err2);
        return res.status(500).json({ message: "Fehler beim Abrufen des Autos" });
      }
      res.status(201).json(rows[0]);
    });
  });
});

// POST Feed-Eintrag
app.post("/cars/:carId/feed", (req, res) => {
  const { carId } = req.params;
  const { content, image_url } = req.body;
  if (!content && !image_url) {
    return res.status(400).json({ message: "Kein Inhalt oder Bild für den Feed-Post" });
  }
  const query = "INSERT INTO car_feed (car_id, content, image_url) VALUES (?, ?, ?)";
  db.query(query, [carId, content, image_url], (err, result) => {
    if (err) {
      console.error("❌ Fehler beim Speichern des Feed-Posts:", err);
      return res.status(500).json({ message: "Datenbankfehler" });
    }
    const newPostId = result.insertId;
    db.query("SELECT * FROM car_feed WHERE id = ?", [newPostId], (err2, rows) => {
      if (err2) {
        console.error("❌ Fehler beim Abrufen des neuen Posts:", err2);
        return res.status(500).json({ message: "Datenbankfehler" });
      }
      res.status(201).json(rows[0]);
    });
  });
});

// DELETE Auto + Feed
app.delete("/cars/:carId", (req, res) => {
  const carId = req.params.carId;
  const deleteFeedQuery = "DELETE FROM car_feed WHERE car_id = ?";
  const deleteCarQuery = "DELETE FROM cars WHERE id = ?";
  db.query(deleteFeedQuery, [carId], (err) => {
    if (err) {
      console.error("❌ Fehler beim Löschen der Feed-Einträge:", err);
      return res.status(500).json({ message: "Fehler beim Löschen der Feed-Einträge" });
    }
    db.query(deleteCarQuery, [carId], (err2, result) => {
      if (err2) {
        console.error("❌ Fehler beim Löschen des Autos:", err2);
        return res.status(500).json({ message: "Fehler beim Löschen des Autos" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Auto nicht gefunden" });
      }
      res.json({ message: "Auto erfolgreich gelöscht" });
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
