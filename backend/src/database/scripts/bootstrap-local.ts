import { Container } from "../../app/Container";
import { AppConfig } from "../../config/AppConfig";

async function main() {
  const config = AppConfig.get();
  if (
    config.database.database !== "songsook_local" ||
    config.database.host !== "127.0.0.1" ||
    config.database.port !== 33307
  )
    throw new Error(
      "This bootstrap only operates on the isolated songsook_local database.",
    );
  const app = new Container(config);
  try {
    await app.migrator.run();
    const existing = await app.customerService.list({
      page: 1,
      limit: 1,
      sort: "id",
      order: "asc",
    });
    if (existing.total) {
      console.log(
        "Local database already contains data; existing records preserved.",
      );
      return;
    }
    await app.settingsService.update({
      shopName: "ส่งสุข · มหาสารคาม",
      shopAddress: "ขามเรียง มหาสารคาม",
    });
    await app.simulationService.generateRiders(6, 1042);
    await app.simulationService.generateCustomers({
      count: 18,
      minRadiusKm: 0.2,
      seed: 1043,
    });
    await app.simulationService.generateOrders({
      count: 15,
      minCount: 15,
      maxCount: 15,
      clearExisting: false,
      ensureCustomers: true,
      uniqueCustomers: true,
      seed: 1044,
    });
    console.log(
      "Created local starter data: 18 customers, 6 riders, 15 orders. All starter orders are labeled simulated in MySQL.",
    );
  } finally {
    await app.database.close();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
