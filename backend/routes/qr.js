const express = require("express");
const nodemailer = require("nodemailer");
const db = require("../db");
const QRCode = require("qrcode"); // Import der QR-Code-Bibliothek

const router = express.Router();

router.post("/:carId", async (req, res) => {
  const { carId } = req.params;
  const { userId } = req.body;

  // Nutzer-E-Mail anhand der userId aus der Datenbank holen
  db.query("SELECT email FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) {
      console.error("Fehler beim Abrufen der Nutzer-E-Mail:", err);
      return res.status(500).json({ message: "Datenbankfehler" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Nutzer nicht gefunden" });
    }

    const userEmail = results[0].email;
    // Hier generieren wir einen QR-Code als Data URL. Du kannst hier den Inhalt anpassen,
    // z.B. eine URL oder einen spezifischen Text. Im Beispiel generieren wir einen QR-Code,
    // der auf eine URL zeigt, die zum entsprechenden Auto führt.
    const qrText = `${process.env.FRONTEND_URL}/public/${carId}`;

    
    QRCode.toDataURL(qrText, (qrErr, qrUrl) => {
      if (qrErr) {
        console.error("Fehler beim Generieren des QR-Codes:", qrErr);
        return res.status(500).json({ message: "Fehler beim Generieren des QR-Codes" });
      }

      // E-Mail-Versand einrichten
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
