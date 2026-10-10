import { TransactionRunner } from "../../database/TransactionRunner";
import { GeoMath } from "../../shared/geo/GeoPoint";
import { SeededRandom } from "../../shared/random/SeededRandom";
import { BusinessCalendar } from "../../shared/time/BusinessCalendar";
import { CustomerInput } from "../customers/Customer";
import { CustomerRepository } from "../customers/CustomerRepository";
import { OrderCreateInput } from "../orders/Order";
import { OrderRepository } from "../orders/OrderRepository";
import { OrderService } from "../orders/OrderService";
import { PlanRepository } from "../plans/PlanRepository";
import { RiderRepository } from "../riders/RiderRepository";
import { SettingsService } from "../settings/SettingsService";
import { ThaiProfileGenerator } from "./ThaiProfileGenerator";

export interface CustomerSimulationRequest {
  count: number;
  radiusKm?: number;
  minRadiusKm: number;
  seed?: number;
}

export interface OrderSimulationRequest {
  count?: number;
  minCount: number;
  maxCount: number;
  deliveryDate?: string;
  clearExisting: boolean;
  ensureCustomers: boolean;
  uniqueCustomers: boolean;
  seed?: number;
}

export class SimulationService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly orders: OrderRepository,
    private readonly orderService: OrderService,
    private readonly plans: PlanRepository,
    private readonly riders: RiderRepository,
    private readonly settings: SettingsService,
    private readonly calendar: BusinessCalendar,
    private readonly transactions: TransactionRunner,
  ) {}

  async generateCustomers(request: CustomerSimulationRequest) {
    const settings = await this.settings.get();
    const seed = request.seed ?? SeededRandom.randomSeed();
    const random = new SeededRandom(seed);
    const radiusKm = request.radiusKm ?? settings.serviceRadiusKm;
    const minRadiusKm = Math.min(request.minRadiusKm, radiusKm);
    const profiles = new ThaiProfileGenerator(random);

    const inputs: CustomerInput[] = Array.from({ length: request.count }, () => {
      const distance = Math.sqrt(minRadiusKm ** 2 + random.next() * (radiusKm ** 2 - minRadiusKm ** 2));
      const bearing = random.next() * 2 * Math.PI;
      const profile = profiles.next();
      return {
        ...profile,
        location: GeoMath.offset(settings.shopLocation, distance, bearing),
        note: "",
        simulated: true,
      };
    });

    await this.customers.createMany(inputs);
    return { seed, created: inputs.length, radiusKm, totalCustomers: await this.customers.count() };
  }

  async generateOrders(request: OrderSimulationRequest) {
    const settings = await this.settings.get();
    const seed = request.seed ?? SeededRandom.randomSeed();
    const random = new SeededRandom(seed);
    const deliveryDate = this.calendar.resolve(request.deliveryDate);
    const count = request.count ?? random.int(request.minCount, request.maxCount);

    const cleared = request.clearExisting ? await this.orderService.clear({ deliveryDate, simulated: true }) : null;

    let customersCreated = 0;
    let customers = await this.customers.findAll();
    if (request.ensureCustomers && customers.length < count) {
      const result = await this.generateCustomers({
        count: count - customers.length,
        minRadiusKm: 0.2,
        seed: random.int(0, 0xffffffff),
      });
      customersCreated = result.created;
      customers = await this.customers.findAll();
    }
    if (customers.length === 0) {
      return { seed, deliveryDate, created: 0, totalBoxes: 0, customersCreated, cleared };
    }

    const shuffled = random.shuffle(customers);
    const inputs: OrderCreateInput[] = Array.from({ length: count }, (_, index) => {
      const customer =
        request.uniqueCustomers && index < shuffled.length ? shuffled[index] : random.pick(customers);
      return {
        customerId: customer.id,
        deliveryDate,
        boxes: random.int(1, settings.maxBoxesPerOrder),
        unitPrice: settings.boxPrice,
        note: "",
        simulated: true,
      };
    });

    await this.orders.createMany(inputs);
    return {
      seed,
      deliveryDate,
      created: inputs.length,
      totalBoxes: inputs.reduce((sum, input) => sum + input.boxes, 0),
      customersCreated,
      cleared,
    };
  }

  async generateRiders(count: number, seedValue?: number) {
    const seed = seedValue ?? SeededRandom.randomSeed();
    const random = new SeededRandom(seed);
    const profiles = new ThaiProfileGenerator(random);
    for (let index = 0; index < count; index++) {
      const profile = profiles.next();
      await this.riders.create({
        name: `${profile.firstName} ${profile.lastName}`,
        phone: profile.phone,
        vehiclePlate: `${random.int(1, 9)}กข ${random.int(1000, 9999)} มหาสารคาม`,
        active: true,
      });
    }
    return { seed, created: count };
  }

  clearOrders(deliveryDate?: string) {
    return this.orderService.clear({ deliveryDate, simulated: true });
  }

  async clearCustomers() {
    const orders = await this.orderService.clear({ simulated: true });
    const deletedCustomers = await this.customers.deleteSimulatedWithoutOrders();
    return { ...orders, deletedCustomers };
  }

  async reset(includeRiders: boolean) {
    return this.transactions.transaction(async (executor) => {
      const deletedPlans = await this.plans.withExecutor(executor).deleteByDate();
      const deletedOrders = await this.orders.withExecutor(executor).deleteByFilter({});
      const deletedCustomers = await this.customers.withExecutor(executor).deleteAll();
      const deletedRiders = includeRiders ? await this.riders.withExecutor(executor).deleteAll() : 0;
      return { deletedPlans, deletedOrders, deletedCustomers, deletedRiders };
    });
  }
}
