const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Verbindung testen
db.connect(err => {
    if (err) {
        console.error("❌ Fehler bei der MySQL-Verbindung:", err);
        return;
    }
    console.log("✅ Erfolgreich mit MySQL verbunden!");
});

module.exports = db;
