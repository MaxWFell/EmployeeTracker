const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  // Your MySQL password
  password: 'Sophiezoey12',
  database: ''
});

module.exports = db;