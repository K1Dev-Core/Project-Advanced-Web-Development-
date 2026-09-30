import { ResultSetHeader } from "mysql2/promise";

export type SqlParams = unknown[];

export interface SqlExecutor {
  query<T>(sql: string, params?: SqlParams): Promise<T[]>;
  execute(sql: string, params?: SqlParams): Promise<ResultSetHeader>;
}
