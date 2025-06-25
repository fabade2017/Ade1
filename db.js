const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLDATABASE,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection error:', err);
    // Log the full error object for more details
    if (err.code) console.error('Error code:', err.code);
    if (err.errno) console.error('Error errno:', err.errno);
    if (err.sqlMessage) console.error('Error SQL message:', err.sqlMessage);
    return;
  }
  console.log('Successfully connected to MySQL!');
  connection.release(); // Release connection if just testing
});
module.exports = pool.promise(); // Use promise-based API
