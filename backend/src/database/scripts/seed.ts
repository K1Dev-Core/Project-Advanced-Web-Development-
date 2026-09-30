import { Container } from "../../app/Container";
import { AppConfig } from "../../config/AppConfig";

async function main(): Promise<void> {
  const container = new Container(AppConfig.get());
  try {
    await container.migrator.run();
    const riders = await container.simulationService.generateRiders(10, 2024);
    const customers = await container.simulationService.generateCustomers({ count: 40, minRadiusKm: 0.2, seed: 2025 });
    const orders = await container.simulationService.generateOrders({
      minCount: 20,
      maxCount: 30,
      clearExisting: true,
      ensureCustomers: true,
      uniqueCustomers: true,
      seed: 2026,
    });
    console.log(JSON.stringify({ riders, customers, orders }, null, 2));
  } finally {
    await container.database.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
