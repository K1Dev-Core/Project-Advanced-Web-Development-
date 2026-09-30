import { AppConfig } from "../config/AppConfig";
import { BaseController } from "../core/http/BaseController";
import { Database } from "../database/Database";
import { Migrator } from "../database/Migrator";
import { AuthController } from "../modules/auth/AuthController";
import { AuthGuard } from "../modules/auth/AuthGuard";
import { AuthService } from "../modules/auth/AuthService";
import { CustomerController } from "../modules/customers/CustomerController";
import { CustomerRepository } from "../modules/customers/CustomerRepository";
import { CustomerService } from "../modules/customers/CustomerService";
import { DashboardController } from "../modules/dashboard/DashboardController";
import { DashboardService } from "../modules/dashboard/DashboardService";
import { JobController } from "../modules/jobs/JobController";
import { JobService } from "../modules/jobs/JobService";
import { OrderController } from "../modules/orders/OrderController";
import { OrderRepository } from "../modules/orders/OrderRepository";
import { OrderService } from "../modules/orders/OrderService";
import { DeliveryPlanner } from "../modules/planning/DeliveryPlanner";
import { PlanController } from "../modules/plans/PlanController";
import { PlanRepository } from "../modules/plans/PlanRepository";
import { PlanService } from "../modules/plans/PlanService";
import { RiderController } from "../modules/riders/RiderController";
import { OsrmRoutingProvider } from "../modules/routing/OsrmRoutingProvider";
import { RoutingService } from "../modules/routing/RoutingService";
import { RiderRepository } from "../modules/riders/RiderRepository";
import { RiderService } from "../modules/riders/RiderService";
import { SettingsController } from "../modules/settings/SettingsController";
import { SettingsRepository } from "../modules/settings/SettingsRepository";
import { SettingsService } from "../modules/settings/SettingsService";
import { SimulationController } from "../modules/simulation/SimulationController";
import { SimulationService } from "../modules/simulation/SimulationService";
import { BusinessCalendar } from "../shared/time/BusinessCalendar";
import { JobCodeGenerator } from "../shared/utils/JobCodeGenerator";

export class Container {
  readonly database: Database;
  readonly migrator: Migrator;
  readonly calendar: BusinessCalendar;
  readonly authService: AuthService;
  readonly authGuard: AuthGuard;

  readonly settingsService: SettingsService;
  readonly customerService: CustomerService;
  readonly orderService: OrderService;
  readonly riderService: RiderService;
  readonly planService: PlanService;
  readonly jobService: JobService;
  readonly simulationService: SimulationService;
  readonly dashboardService: DashboardService;

  constructor(readonly config: AppConfig) {
    this.database = Database.connect(config.database);
    this.migrator = new Migrator(this.database);
    this.calendar = new BusinessCalendar(config.server.timezone);
    this.authService = new AuthService(config.auth);
    this.authGuard = new AuthGuard(this.authService);

    const settingsRepository = new SettingsRepository(this.database);
    const customerRepository = new CustomerRepository(this.database);
    const orderRepository = new OrderRepository(this.database);
    const riderRepository = new RiderRepository(this.database);
    const planRepository = new PlanRepository(this.database);

    this.settingsService = new SettingsService(settingsRepository);
    this.customerService = new CustomerService(customerRepository, orderRepository);
    this.orderService = new OrderService(
      orderRepository,
      customerRepository,
      planRepository,
      this.settingsService,
      this.calendar,
      this.database,
    );
    this.riderService = new RiderService(riderRepository);
    this.planService = new PlanService(
      planRepository,
      orderRepository,
      riderRepository,
      this.settingsService,
      new DeliveryPlanner(),
      this.createRoutingService(),
      new JobCodeGenerator(),
      this.calendar,
      this.database,
    );
    this.jobService = new JobService(planRepository, orderRepository, this.database);
    this.simulationService = new SimulationService(
      customerRepository,
      orderRepository,
      this.orderService,
      planRepository,
      riderRepository,
      this.settingsService,
      this.calendar,
      this.database,
    );
    this.dashboardService = new DashboardService(
      customerRepository,
      orderRepository,
      riderRepository,
      planRepository,
      this.settingsService,
      this.calendar,
    );
  }

  private createRoutingService(): RoutingService {
    const routing = this.config.routing;
    const provider =
      routing.provider === "osrm"
        ? new OsrmRoutingProvider(routing.osrmUrl, routing.osrmProfile, routing.timeoutMs)
        : null;
    return new RoutingService(provider, routing.concurrency);
  }

  controllers(): BaseController[] {
    return [
      new AuthController(this.authService, this.authGuard),
      new DashboardController(this.dashboardService),
      new SettingsController(this.settingsService),
      new CustomerController(this.customerService, this.orderService),
      new OrderController(this.orderService, this.calendar),
      new RiderController(this.riderService),
      new PlanController(this.planService),
      new JobController(this.jobService),
      new SimulationController(this.simulationService),
    ];
  }
}
