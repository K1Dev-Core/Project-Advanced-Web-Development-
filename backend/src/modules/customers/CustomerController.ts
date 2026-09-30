import { BaseController } from "../../core/http/BaseController";
import { Pagination } from "../../core/http/Pagination";
import { CommonSchemas } from "../../core/validation/CommonSchemas";
import { OrderSchemas } from "../orders/OrderSchemas";
import { OrderService } from "../orders/OrderService";
import { CustomerSchemas } from "./CustomerSchemas";
import { CustomerService } from "./CustomerService";

export class CustomerController extends BaseController {
  readonly basePath = "/customers";

  constructor(
    private readonly service: CustomerService,
    private readonly orders: OrderService,
  ) {
    super();
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.action(async (req, res) => {
        const query = CustomerSchemas.list.parse(req.query);
        const page = await this.service.list({
          search: query.search ?? query.q,
          firstName: query.firstName,
          lastName: query.lastName,
          sort: query.sort,
          order: query.order,
          page: query.page,
          limit: query.limit,
        });
        this.ok(res, page.items, Pagination.meta(page));
      }),
    );

    this.router.get(
      "/nearby",
      this.action(async (req, res) => {
        const query = CommonSchemas.nearby(1).parse(req.query);
        const items = await this.service.nearby({ latitude: query.lat, longitude: query.lng }, query.radius);
        this.ok(res, items, {
          center: { latitude: query.lat, longitude: query.lng },
          radiusKm: query.radius,
          total: items.length,
        });
      }),
    );

    this.router.get(
      "/:id",
      this.action(async (req, res) => {
        this.ok(res, await this.service.get(this.idParam(req)));
      }),
    );

    this.router.get(
      "/:id/orders",
      this.action(async (req, res) => {
        const id = this.idParam(req);
        await this.service.get(id);
        const query = OrderSchemas.list.parse(req.query);
        const page = await this.orders.list({ ...query, customerId: id });
        this.ok(res, page.items, Pagination.meta(page));
      }),
    );

    this.router.post(
      "/",
      this.action(async (req, res) => {
        const input = CustomerSchemas.create.parse(req.body ?? {});
        this.created(res, await this.service.create(input));
      }),
    );

    const update = this.action(async (req, res) => {
      const changes = CustomerSchemas.update.parse(req.body ?? {});
      this.ok(res, await this.service.update(this.idParam(req), changes));
    });
    this.router.put("/:id", update);
    this.router.patch("/:id", update);

    this.router.delete(
      "/:id",
      this.action(async (req, res) => {
        const { force } = CustomerSchemas.remove.parse(req.query);
        this.ok(res, await this.service.remove(this.idParam(req), force));
      }),
    );
  }
}
