const express = require("express");
const nodemailer = require("nodemailer");
const db = require("../db");
const QRCode = require("qrcode");

const router = express.Router();

router.post("/:carId", async (req, res) => {
  const { carId } = req.params;
  const { userId } = req.body;

  // 1. E-Mail des Nutzers anhand der ID holen
  db.query("SELECT email FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) {
      console.error("Fehler beim Abrufen der Nutzer-E-Mail:", err);
      return res.status(500).json({ message: "Datenbankfehler" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Nutzer nicht gefunden" });
    }

    const userEmail = results[0].email;

    // 2. QR-Link generieren (jetzt auf Vercel-Domain!)
    const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, ""); // Trailing Slash entfernen
    const qrText = `${frontendUrl}/public/cars/${carId}`;
    console.log("Generierter QR-Code Link:", qrText);

    // 3. QR-Code als DataURL erzeugen
    QRCode.toDataURL(qrText, (qrErr, qrUrl) => {
      if (qrErr) {
        console.error("Fehler beim Generieren des QR-Codes:", qrErr);
        return res.status(500).json({ message: "Fehler beim Generieren des QR-Codes" });
      }

      // 4. Mailversand vorbereiten
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"CarGarage" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Dein QR-Code für dein Fahrzeug",
        html: `<p>Hier ist dein QR-Code:</p><img src="${qrUrl}" alt="QR-Code"/>`,
      };

      // 5. Mail senden
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Fehler beim Senden der E-Mail:", error);
          return res.status(500).json({ message: "Fehler beim Versenden der E-Mail." });
        } else {
          console.log("E-Mail gesendet:", info.response);
          return res.status(200).json({ message: "QR-Code wurde gesendet!" });
        }
      });
    });
  });
});

module.exports = router;
