import * as sql from 'mssql';
import 'dotenv/config';
import type { DatabaseError } from './types';

class Database {
  private static instance: Database;
  private pool: sql.ConnectionPool | null = null;
  private config: sql.config = {
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    server: process.env.DB_SERVER!,
    database: process.env.DB_NAME!,
    options: {
      encrypt: true,
    },
  };

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async getPool(): Promise<sql.ConnectionPool> {
    try {
      if (!this.pool) {
        this.pool = await new sql.ConnectionPool(this.config).connect();
        console.log('Connected to Azure SQL Database');
      }
      return this.pool;
    } catch (err) {
      const dbError = err as DatabaseError;
      console.error('Database connection failed:', dbError.message);
      throw dbError;
    }
  }

  public async closePool(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
      }
    } catch (err) {
      const dbError = err as DatabaseError;
      console.error('Error closing database connection:', dbError.message);
      throw dbError;
    }
  }
}

export const db = Database.getInstance();