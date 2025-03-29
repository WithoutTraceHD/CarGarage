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

// 🔍 Auto-Suche nach Marke oder Modell + Username
router.get("/cars", (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: "Suchbegriff fehlt" });

  const sql = `
    SELECT cars.id, cars.brand, cars.model, cars.year, users.username
    FROM cars
    JOIN garages ON cars.garage_id = garages.id
    JOIN users ON garages.user_id = users.id
    WHERE cars.brand LIKE ? OR cars.model LIKE ?
  `;

  db.query(sql, [`%${query}%`, `%${query}%`], (err, results) => {
    if (err) {
      console.error("Fehler bei Autosuche:", err);
      return res.status(500).json({ message: "Fehler bei der Suche" });
    }
    res.json(results);
  });
});

module.exports = router;
