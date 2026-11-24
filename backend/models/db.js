const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    dateStrings: ['DATE'],
  })
  .promise();

// authController / dashboardController call db.promise(); keep that working
db.promise = () => db;

db.getConnection()
  .then((conn) => {
    console.log('Connected to MySQL');
    conn.release();
  })
  .catch((err) => console.error('Database connection failed:', err.message));

module.exports = db;