const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:type', (req, res) => {
    const type = req.params.type;
    const sql = 'SELECT question_text as q, keywords FROM questions WHERE category = ?';
    db.query(sql, [type], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching questions" });
        
        // Convert "key1,key2" string back to array ["key1", "key2"]
        const formatted = results.map(row => ({
            q: row.q,
            keywords: row.keywords ? row.keywords.split(',') : []
        }));
        
        res.json(formatted);
    });
});

module.exports = router;