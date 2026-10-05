import { createPool, Pool, PoolConnection, PoolOptions, ResultSetHeader } from "mysql2/promise";
import { DatabaseConfig } from "../config/AppConfig";
import { SqlExecutor, SqlParams } from "./SqlExecutor";

class ConnectionExecutor implements SqlExecutor {
  constructor(private readonly connection: PoolConnection) {}

  async query<T>(sql: string, params?: SqlParams): Promise<T[]> {
    const [rows] = await this.connection.query(sql, params as never);
    return rows as T[];
  }

  async execute(sql: string, params?: SqlParams): Promise<ResultSetHeader> {
    const [result] = await this.connection.query(sql, params as never);
    return result as ResultSetHeader;
  }
}

export class Database implements SqlExecutor {
  private static instance?: Database;

  private readonly pool: Pool;

  private constructor(config: DatabaseConfig) {
    this.pool = createPool(Database.buildOptions(config));
    this.pool.pool.on("connection", (connection) => {
      connection.query("SET time_zone = '+00:00'");
    });
  }

  static connect(config: DatabaseConfig): Database {
    if (!Database.instance) {
      Database.instance = new Database(config);
    }
    return Database.instance;
  }

  async query<T>(sql: string, params?: SqlParams): Promise<T[]> {
    const [rows] = await this.pool.query(sql, params as never);
    return rows as T[];
  }

  async execute(sql: string, params?: SqlParams): Promise<ResultSetHeader> {
    const [result] = await this.pool.query(sql, params as never);
    return result as ResultSetHeader;
  }

  async transaction<T>(work: (executor: SqlExecutor) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(new ConnectionExecutor(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async ping(): Promise<boolean> {
    await this.pool.query("SELECT 1");
    return true;
  }

  async close(): Promise<void> {
    await this.pool.end();
    Database.instance = undefined;
  }

  private static buildOptions(config: DatabaseConfig): PoolOptions {
    const ssl = config.ssl
      ? { rejectUnauthorized: config.sslRejectUnauthorized, ...(config.sslCa ? { ca: config.sslCa } : {}) }
      : undefined;

    const base: PoolOptions = {
      connectionLimit: config.connectionLimit,
      waitForConnections: true,
      enableKeepAlive: true,
      timezone: "Z",
      dateStrings: ["DATE"],
      decimalNumbers: true,
      charset: "utf8mb4",
      multipleStatements: false,
      ssl,
    };

    if (config.url) {
      return { ...base, uri: config.url };
    }

    return {
      ...base,
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    };
  }
}
