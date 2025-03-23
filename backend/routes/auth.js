// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const db = require("../db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();

// Registrierung
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Benutzername erforderlich"),
    body("email").isEmail().withMessage("Ungültige E-Mail"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Passwort muss mindestens 6 Zeichen haben"),
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
        if (result.length > 0)
          return res.status(400).json({ message: "E-Mail bereits vergeben" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        db.query(
          "INSERT INTO users (username, email, password, is_verified, verification_token) VALUES (?, ?, ?, ?, ?)",
          [username, email, hashedPassword, false, verificationToken],
          (err, result) => {
            if (err) {
              return res
                .status(500)
                .json({ message: "Fehler beim Erstellen des Nutzers" });
            }
            const newUserId = result.insertId;
            const defaultGarageName = "Meine Garage";
            db.query(
              "INSERT INTO garages (user_id, name) VALUES (?, ?)",
              [newUserId, defaultGarageName],
              (err2) => {
                if (err2) {
                  console.error("Fehler beim Anlegen der Garage:", err2);
                  return res
                    .status(500)
                    .json({ message: "Fehler beim Anlegen der Garage" });
                }
                const transporter = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                  },
                });
                const verifyLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
                console.log("Verifizierungslink:", verifyLink);
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
                    return res.status(500).json({
                      message:
                        "Registrierung erfolgreich, aber E-Mail konnte nicht gesendet werden.",
                    });
                  } else {
                    console.log("Bestätigungs-E-Mail gesendet:", info.response);
                    res
                      .status(201)
                      .json({ message: "Registrierung erfolgreich! Bitte E-Mail bestätigen." });
                  }
                });
              }
            );
          }
        );
      });
    } catch (error) {
      console.error("Serverfehler:", error);
      res.status(500).json({ message: "Serverfehler" });
    }
  }
);

// Login
router.post(
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
          console.error("Fehler bei Login-Query:", err);
          return res.status(500).json({ message: "Datenbankfehler" });
        }
        if (result.length === 0) {
          return res.status(400).json({ message: "E-Mail nicht gefunden" });
        }
        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Falsches Passwort" });
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
      console.error("Serverfehler beim Login:", error);
      res.status(500).json({ message: "Serverfehler" });
    }
  }
);

module.exports = router;
