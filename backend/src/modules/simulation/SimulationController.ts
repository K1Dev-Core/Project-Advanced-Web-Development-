import { BaseController } from "../../core/http/BaseController";
import { SimulationSchemas } from "./SimulationSchemas";
import { SimulationService } from "./SimulationService";

export class SimulationController extends BaseController {
  readonly basePath = "/simulations";

  constructor(private readonly service: SimulationService) {
    super();
  }

  protected registerRoutes(): void {
    this.router.post(
      "/customers",
      this.action(async (req, res) => {
        const request = SimulationSchemas.customers.parse(req.body ?? {});
        this.created(res, await this.service.generateCustomers(request));
      }),
    );

    this.router.post(
      "/orders",
      this.action(async (req, res) => {
        const request = SimulationSchemas.orders.parse(req.body ?? {});
        this.created(res, await this.service.generateOrders(request));
      }),
    );

    this.router.post(
      "/riders",
      this.action(async (req, res) => {
        const request = SimulationSchemas.riders.parse(req.body ?? {});
        this.created(res, await this.service.generateRiders(request.count, request.seed));
      }),
    );

    this.router.delete(
      "/",
      this.action(async (req, res) => {
        const { includeRiders } = SimulationSchemas.reset.parse(req.query);
        this.ok(res, await this.service.reset(includeRiders));
      }),
    );
  }
}
