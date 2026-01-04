const express = require('express');
const router = express.Router();
const db = require('../db'); // Import DB connection

// SIGNUP
router.post('/signup', (req, res) => {
    const { email, password } = req.body;
    const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(sql, [email, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "User already exists" });
            return res.status(500).json({ message: "Database error" });
        }
        res.json({ success: true, message: "Signup successful" });
    });
});

// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length > 0) {
            res.json({ success: true, name: results[0].email.split('@')[0] });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    });
});

module.exports = router;