const express = require("express");
const db = require("../db");
const router = express.Router();

// 🔍 Nutzer-Suche nach Username
router.get("/users", (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: "Suchbegriff fehlt" });

  db.query(
    "SELECT id, username FROM users WHERE username LIKE ?",
    [`%${query}%`],
    (err, results) => {
      if (err) {
        console.error("Fehler bei Nutzersuche:", err);
        return res.status(500).json({ message: "Fehler bei der Suche" });
      }
      res.json(results);
    }
  );
});

// 🔍 Auto-Suche nach Marke oder Modell
router.get("/cars", (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: "Suchbegriff fehlt" });

  db.query(
    "SELECT id, brand, model, year FROM cars WHERE brand LIKE ? OR model LIKE ?",
    [`%${query}%`, `%${query}%`],
    (err, results) => {
      if (err) {
        console.error("Fehler bei Autosuche:", err);
        return res.status(500).json({ message: "Fehler bei der Suche" });
      }
      res.json(results);
    }
  );
});

module.exports = router;
