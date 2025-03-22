require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const db = require("./db");
const multer = require("multer");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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

// 🟡 REGISTRIERUNG MIT E-MAIL VERIFIZIERUNG
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
        const verificationToken = crypto.randomBytes(32).toString("hex");

        db.query(
          "INSERT INTO users (username, email, password, is_verified, verification_token) VALUES (?, ?, ?, ?, ?)",
          [username, email, hashedPassword, false, verificationToken],
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

                const transporter = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                  },
                });

                const verifyLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
                const mailOptions = {
                  from: `"CarGarage" <${process.env.EMAIL_USER}>`,
                  to: email,
                  subject: "Bitte bestätige deine Registrierung",
                  html: `
                    <h2>Willkommen bei CarGarage!</h2>
                    <p>Klicke auf den folgenden Link, um deine E-Mail zu bestätigen:</p>
                    <a href="${verifyLink}">${verifyLink}</a>
                  `,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    console.error("Fehler beim E-Mail-Versand:", error);
                    return res.status(500).json({ message: "Registrierung erfolgreich, aber E-Mail konnte nicht gesendet werden." });
                  } else {
                    console.log("Bestätigungs-E-Mail gesendet:", info.response);
                    res.status(201).json({ message: "Registrierung erfolgreich! Bitte E-Mail bestätigen." });
                  }
                });
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

// 🟢 LOGIN mit Debug-Logging für Fehler
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
        if (err) {
          console.error("❌ Fehler bei Login-Query:", err);
          return res.status(500).json({ message: "Datenbankfehler" });
        }

        if (result.length === 0) {
          return res.status(400).json({ message: "E-Mail nicht gefunden" });
        }

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(400).json({ message: "❌ Falsches Passwort" });
        }

        res.status(200).json({
          message: "Login erfolgreich!",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        });
      });
    } catch (error) {
      console.error("❌ Serverfehler beim Login:", error);
      res.status(500).json({ message: "Serverfehler" });
    }
  }
);

// 🔧 GET /garages?user_id=... → Nutzer-Garagen abrufen
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

// 🔧 GET /garages/:garageId/cars → Autos einer Garage laden
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

// 🔍 GET /cars/:carId → Auto + Besitzername abrufen
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

// 🔧 POST /cars/:carId/feed → Feed-Post für Auto erstellen
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

    // Abrufen des frisch erstellten Posts
    db.query("SELECT * FROM car_feed WHERE id = ?", [newPostId], (err2, rows) => {
      if (err2) {
        console.error("❌ Fehler beim Abrufen des neuen Posts:", err2);
        return res.status(500).json({ message: "Datenbankfehler" });
      }

      res.status(201).json(rows[0]);
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
