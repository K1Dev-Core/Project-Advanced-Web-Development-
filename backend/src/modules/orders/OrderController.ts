import { BaseController } from "../../core/http/BaseController";
import { Pagination } from "../../core/http/Pagination";
import { BusinessCalendar } from "../../shared/time/BusinessCalendar";
import { OrderSchemas } from "./OrderSchemas";
import { OrderService } from "./OrderService";

export class OrderController extends BaseController {
  readonly basePath = "/orders";

  constructor(
    private readonly service: OrderService,
    private readonly calendar: BusinessCalendar,
  ) {
    super();
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.action(async (req, res) => {
        const query = OrderSchemas.list.parse(req.query);
        const page = await this.service.list(query);
        this.ok(res, page.items, Pagination.meta(page));
      }),
    );

    this.router.get(
      "/summary",
      this.action(async (req, res) => {
        const query = OrderSchemas.summary.parse(req.query);
        const date = query.all ? undefined : this.calendar.resolve(query.deliveryDate);
        this.ok(res, await this.service.summary(date));
      }),
    );

    this.router.get(
      "/nearby",
      this.action(async (req, res) => {
        const query = OrderSchemas.nearby.parse(req.query);
        const center = { latitude: query.lat, longitude: query.lng };
        const deliveryDate = query.deliveryDate ?? query.date;
        const items = await this.service.nearby(center, query.radius, { deliveryDate, status: query.status });
        this.ok(res, items, {
          center,
          radiusKm: query.radius,
          deliveryDate: deliveryDate ?? null,
          total: items.length,
          totalBoxes: items.reduce((sum, order) => sum + order.boxes, 0),
        });
      }),
    );

    this.router.get(
      "/:id",
      this.action(async (req, res) => {
        this.ok(res, await this.service.get(this.idParam(req)));
      }),
    );

    this.router.post(
      "/",
      this.action(async (req, res) => {
        const input = OrderSchemas.create.parse(req.body ?? {});
        this.created(res, await this.service.create(input));
      }),
    );

    const update = this.action(async (req, res) => {
      const changes = OrderSchemas.update.parse(req.body ?? {});
      this.ok(res, await this.service.update(this.idParam(req), changes));
    });
    this.router.put("/:id", update);
    this.router.patch("/:id", update);

    this.router.patch(
      "/:id/boxes",
      this.action(async (req, res) => {
        const change = OrderSchemas.boxes.parse(req.body ?? {});
        this.ok(res, await this.service.changeBoxes(this.idParam(req), change));
      }),
    );

    this.router.delete(
      "/",
      this.action(async (req, res) => {
        const filter = OrderSchemas.filter.parse(req.query);
        this.ok(res, await this.service.clear(filter));
      }),
    );

    this.router.delete(
      "/:id",
      this.action(async (req, res) => {
        this.ok(res, await this.service.remove(this.idParam(req)));
      }),
    );
  }
}
