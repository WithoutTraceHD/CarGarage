require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const db = require("./db");
const multer = require("multer");

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

app.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Benutzername erforderlich"),
    body("email").isEmail().withMessage("Ungültige E-Mail"),
    body("password").isLength({ min: 6 }).withMessage("Passwort muss mindestens 6 Zeichen haben"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ message: "Datenbankfehler" });
        if (result.length > 0) return res.status(400).json({ message: "E-Mail bereits vergeben" });

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
          [username, email, hashedPassword],
          (err, result) => {
            if (err) {
              return res.status(500).json({ message: "Fehler beim Erstellen des Nutzers" });
            }

            const newUserId = result.insertId;
            const defaultGarageName = "Meine Garage";

            db.query(
              "INSERT INTO garages (user_id, name) VALUES (?, ?)",
              [newUserId, defaultGarageName],
              (err2) => {
                if (err2) {
                  console.error("Fehler beim Anlegen der Garage:", err2);
                  return res.status(500).json({ message: "Fehler beim Anlegen der Garage" });
                }

                res.status(201).json({ message: "Nutzer (und Garage) erfolgreich registriert!" });
              }
            );
          }
        );
      });
    } catch (error) {
      console.error("❌ Serverfehler:", error);
      res.status(500).json({ message: "Serverfehler" });
    }
  }
);

app.post(
  "/login",
  [
    body("email").isEmail().withMessage("Ungültige E-Mail"),
    body("password").notEmpty().withMessage("Passwort erforderlich"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ message: "Datenbankfehler" });
        if (result.length === 0) return res.status(400).json({ message: "E-Mail nicht gefunden" });

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(400).json({ message: "❌ Falsches Passwort" });
        }

        res.status(200).json({
          message: "Login erfolgreich!",
          user: { id: user.id, username: user.username, email: user.email },
        });
      });
    } catch (error) {
      console.error("❌ Serverfehler:", error);
      res.status(500).json({ message: "Serverfehler" });
    }
  }
);

app.get("/garages", (req, res) => {
  const user_id = req.query.user_id;
  let query = "SELECT * FROM garages";
  let params = [];
  if (user_id) {
    query += " WHERE user_id = ?";
    params.push(user_id);
  }
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: "Datenbankfehler" });
    res.json(results);
  });
});

app.get("/garages/:garageId/cars", (req, res) => {
  const garageId = req.params.garageId;
  const query = "SELECT * FROM cars WHERE garage_id = ?";
  db.query(query, [garageId], (err, results) => {
    if (err) return res.status(500).json({ message: "Datenbankfehler" });
    res.json(results);
  });
});

app.post("/cars", (req, res) => {
  const { garage_id, brand, model, year, image_url } = req.body;
  if (!garage_id || !brand || !model || !year) {
    return res.status(400).json({ message: "Fehlende Felder" });
  }
  const query = "INSERT INTO cars (garage_id, brand, model, year, image_url) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [garage_id, brand, model, year, image_url || null], (err, result) => {
    if (err) return res.status(500).json({ message: "Datenbankfehler" });
    const newCar = {
      id: result.insertId,
      garage_id,
      brand,
      model,
      year,
      image_url: image_url || null,
    };
    res.status(201).json(newCar);
  });
});

app.delete("/cars/:carId", (req, res) => {
  const { carId } = req.params;
  const query = "DELETE FROM cars WHERE id = ?";
  db.query(query, [carId], (err, result) => {
    if (err) return res.status(500).json({ message: "Datenbankfehler" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Auto nicht gefunden" });
    }
    res.status(200).json({ message: "Auto gelöscht" });
  });
});

app.get("/cars/:carId/feed", (req, res) => {
  const { carId } = req.params;
  const query = "SELECT * FROM car_feed WHERE car_id = ? ORDER BY created_at DESC";
  db.query(query, [carId], (err, results) => {
    if (err) return res.status(500).json({ message: "Datenbankfehler" });
    res.json(results);
  });
});

app.post("/cars/:carId/feed", (req, res) => {
  const { carId } = req.params;
  const { content, image_url } = req.body;
  if (!content && !image_url) {
    return res.status(400).json({ message: "Kein Inhalt oder Bild für den Feed-Post" });
  }
  const query = "INSERT INTO car_feed (car_id, content, image_url) VALUES (?, ?, ?)";
  db.query(query, [carId, content, image_url], (err, result) => {
    if (err) return res.status(500).json({ message: "Datenbankfehler" });
    const newPostId = result.insertId;
    const selectQuery = "SELECT * FROM car_feed WHERE id = ?";
    db.query(selectQuery, [newPostId], (err2, rows) => {
      if (err2) return res.status(500).json({ message: "Datenbankfehler" });
      res.status(201).json(rows[0]);
    });
  });
});

// 🔧 Auto inkl. Besitzername abrufen
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
    if (err) return res.status(500).json({ message: "Datenbankfehler" });
    if (results.length === 0) {
      return res.status(404).json({ message: "Auto nicht gefunden" });
    }
    res.json(results[0]);
  });
});

// 🗑️ Einzelnen Feed-Post löschen
app.delete("/cars/:carId/feed/:feedId", (req, res) => {
  const { feedId } = req.params;
  const query = "DELETE FROM car_feed WHERE id = ?";
  db.query(query, [feedId], (err, result) => {
    if (err) return res.status(500).json({ message: "Datenbankfehler beim Löschen" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Feed-Post nicht gefunden" });
    }
    res.status(200).json({ message: "Feed-Post gelöscht" });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
