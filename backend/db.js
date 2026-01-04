const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // Your MySQL Username
    password: 'mehak_17', // Your MySQL Password
    database: 'mock_interview_db'
});

db.connect(err => {
    if (err) console.error('DB Connection Failed:', err);
    else console.log('Connected to MySQL Database');
});

module.exports = db;