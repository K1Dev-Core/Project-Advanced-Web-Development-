import { SqlExecutor } from "./SqlExecutor";

export interface TransactionRunner {
  transaction<T>(work: (executor: SqlExecutor) => Promise<T>): Promise<T>;
}
