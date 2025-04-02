import mysql from 'mysql2/promise';
import { RowDataPacket, OkPacket, ResultSetHeader, FieldPacket } from 'mysql2';
import { DatabaseError } from './types';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

// Create a connection pool
export const pool = mysql.createPool(dbConfig);

export type QueryParams = string | number | boolean | null;

export type QueryResult = RowDataPacket[] | OkPacket | ResultSetHeader;

// Function to execute a query
export async function query<T>(
  sql: string,
  values: QueryParams[] = []
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(sql, values);
    return rows as T;
  } catch (error) {
    throw error as DatabaseError;
  } finally {
    connection.release();
  }
}

// Function to execute a query without returning results
export async function execute(
  sql: string,
  values: QueryParams[] = []
): Promise<OkPacket | ResultSetHeader> {
  const connection = await pool.getConnection();
  try {
    const [result]: [OkPacket | ResultSetHeader, FieldPacket[]] = 
      await connection.execute(sql, values);
    return result;
  } catch (error) {
    throw error as DatabaseError;
  } finally {
    connection.release();
  }
}