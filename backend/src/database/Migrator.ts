import { Database } from "./Database";
import { Migration, migrations } from "./migrations";

interface AppliedRow {
  version: number;
}

export class Migrator {
  private static pending?: Promise<number[]>;

  constructor(
    private readonly database: Database,
    private readonly list: Migration[] = migrations,
  ) {}

  runOnce(): Promise<number[]> {
    if (!Migrator.pending) {
      Migrator.pending = this.run().catch((error) => {
        Migrator.pending = undefined;
        throw error;
      });
    }
    return Migrator.pending;
  }

  async run(): Promise<number[]> {
    await this.database.execute(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version INT UNSIGNED NOT NULL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );

    const rows = await this.database.query<AppliedRow>("SELECT version FROM schema_migrations");
    const applied = new Set(rows.map((row) => Number(row.version)));
    const executed: number[] = [];

    for (const migration of [...this.list].sort((a, b) => a.version - b.version)) {
      if (applied.has(migration.version)) {
        continue;
      }
      for (const statement of migration.statements) {
        await this.database.execute(statement);
      }
      await this.database.execute("INSERT INTO schema_migrations (version, name) VALUES (?, ?)", [
        migration.version,
        migration.name,
      ]);
      executed.push(migration.version);
    }

    return executed;
  }
}
