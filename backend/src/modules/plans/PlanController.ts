import { BaseController } from "../../core/http/BaseController";
import { Pagination } from "../../core/http/Pagination";
import { PlanSchemas } from "./PlanSchemas";
import { PlanService } from "./PlanService";

export class PlanController extends BaseController {
  readonly basePath = "/plans";

  constructor(private readonly service: PlanService) {
    super();
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.action(async (req, res) => {
        const query = PlanSchemas.list.parse(req.query);
        const page = await this.service.list(query);
        this.ok(res, page.items, Pagination.meta(page));
      }),
    );

    this.router.get(
      "/objectives",
      this.action(async (_req, res) => {
        this.ok(res, this.service.objectives());
      }),
    );

    this.router.get(
      "/latest",
      this.action(async (req, res) => {
        const query = PlanSchemas.latest.parse(req.query);
        this.ok(res, await this.service.latest(query.deliveryDate ?? query.date));
      }),
    );

    this.router.post(
      "/preview",
      this.action(async (req, res) => {
        const request = PlanSchemas.generate.parse(req.body ?? {});
        this.ok(res, await this.service.preview(request));
      }),
    );

    this.router.post(
      "/",
      this.action(async (req, res) => {
        const request = PlanSchemas.generate.parse(req.body ?? {});
        this.created(res, await this.service.create(request));
      }),
    );

    this.router.get(
      "/:id",
      this.action(async (req, res) => {
        this.ok(res, await this.service.get(this.idParam(req)));
      }),
    );

    this.router.post(
      "/:id/recalculate",
      this.action(async (req, res) => {
        const request = PlanSchemas.recalculate.parse(req.body ?? {});
        const result = await this.service.recalculate(this.idParam(req), request);
        this.ok(res, result.plan, { exhaustedAlternatives: result.exhausted });
      }),
    );

    this.router.post(
      "/:id/confirm",
      this.action(async (req, res) => {
        this.ok(res, await this.service.confirm(this.idParam(req)));
      }),
    );

    this.router.post(
      "/:id/cancel",
      this.action(async (req, res) => {
        this.ok(res, await this.service.cancel(this.idParam(req)));
      }),
    );

    this.router.patch(
      "/:id/routes/:routeId/rider",
      this.action(async (req, res) => {
        const { riderId } = PlanSchemas.assignRider.parse(req.body ?? {});
        this.ok(res, await this.service.assignRider(this.idParam(req), this.idParam(req, "routeId"), riderId));
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
