import { AppConfig } from "../../config/AppConfig";
import { Database } from "../Database";
import { Migrator } from "../Migrator";

async function main(): Promise<void> {
  const database = Database.connect(AppConfig.get().database);
  try {
    const applied = await new Migrator(database).run();
    console.log(applied.length > 0 ? `Applied migrations: ${applied.join(", ")}` : "Database is up to date");
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
