import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

// Create a connection pool
export const pool = mysql.createPool(dbConfig);

// Function to execute a query
export async function query(sql: string, values?: any[]) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(sql, values);
    return rows;
  } finally {
    connection.release();
  }
}

// Function to execute a query without returning results
export async function execute(sql: string, values?: any[]) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(sql, values);
    return result;
  } finally {
    connection.release();
  }
}