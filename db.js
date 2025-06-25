//const mysql = require('mysql2');
require('dotenv').config();
// In your db/sqlConfig.js or serverupdate.js where you define the pool

const mysql = require('mysql2/promise'); // Using promise-based version is generally better

const config = {
  host: process.env.MYSQLHOST || process.env.DATABASE_HOST, // Use the actual ENV var name from Railway
  user: process.env.MYSQLUSER || process.env.DATABASE_USER, // Use the actual ENV var name from Railway
  password: process.env.MYSQLPASSWORD || process.env.DATABASE_PASSWORD, // Use the actual ENV var name from Railway
  database: process.env.MYSQLDATABASE || process.env.DATABASE_NAME, // Use the actual ENV var name from Railway
  port: parseInt(process.env.MYSQLPORT || process.env.DATABASE_PORT || '3306', 10), // Ensure port is parsed as integer
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Add a console log to verify what your app IS trying to connect with
console.log("Attempting to connect to DB with config:", {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    // NEVER log password in production!
});

const pool = mysql.createPool(config);

// You can test the connection on startup
pool.getConnection()
  .then(connection => {
    console.log('Database connection successful!');
    connection.release(); // Release the connection immediately
  })
  .catch(err => {
    console.error('Failed to establish initial database connection:', err);
    // You might want to exit the process if critical db connection fails
    // process.exit(1);
  });

module.exports = pool; // Export the pool for use in controllers
/*
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
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
*/
