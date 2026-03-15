import mysql from 'mysql2/promise';
import type { Pool, RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';

type QueryResult<T> = T extends RowDataPacket[] | OkPacket | ResultSetHeader ? [T, mysql.FieldPacket[]] : never;

/**
 * DatabaseClient — MySQL connection pool singleton.
 *
 * Usage:
 *   const db = DatabaseClient.getInstance();
 *   const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
 */
export class DatabaseClient {
  private static instance: DatabaseClient;
  private pool: Pool | null = null;

  private constructor() {}

  static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  async connect(): Promise<void> {
    if (this.pool) return;

    this.pool = mysql.createPool({
      host:     process.env.DB_HOST     ?? 'localhost',
      port:     Number(process.env.DB_PORT ?? 3306),
      database: process.env.DB_NAME     ?? 'ai_gateway',
      user:     process.env.DB_USER     ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    });

    // Verify connection
    const conn = await this.pool.getConnection();
    conn.release();
    console.log(`[DB] Connected to MySQL — ${process.env.DB_NAME ?? 'ai_gateway'}`);
  }

  async query<T = any>(sql: string, params?: any[]): Promise<[T, mysql.FieldPacket[]]> {
    if (!this.pool) {
      throw new Error('DatabaseClient: pool not initialized. Call connect() first.');
    }
    return this.pool.execute(sql, params) as Promise<[T, mysql.FieldPacket[]]>;
  }

  async transaction<T>(
    callback: (conn: mysql.PoolConnection) => Promise<T>,
  ): Promise<T> {
    if (!this.pool) throw new Error('DatabaseClient: pool not initialized.');

    const conn = await this.pool.getConnection();
    await conn.beginTransaction();

    try {
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('[DB] MySQL pool closed');
    }
  }
}
