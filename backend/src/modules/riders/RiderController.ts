import { BaseController } from "../../core/http/BaseController";
import { Pagination } from "../../core/http/Pagination";
import { RiderSchemas } from "./RiderSchemas";
import { RiderService } from "./RiderService";

export class RiderController extends BaseController {
  readonly basePath = "/riders";

  constructor(private readonly service: RiderService) {
    super();
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.action(async (req, res) => {
        const query = RiderSchemas.list.parse(req.query);
        const page = await this.service.list(query);
        this.ok(res, page.items, Pagination.meta(page));
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
        const input = RiderSchemas.create.parse(req.body ?? {});
        this.created(res, await this.service.create(input));
      }),
    );

    const update = this.action(async (req, res) => {
      const changes = RiderSchemas.update.parse(req.body ?? {});
      this.ok(res, await this.service.update(this.idParam(req), changes));
    });
    this.router.put("/:id", update);
    this.router.patch("/:id", update);

    this.router.delete(
      "/:id",
      this.action(async (req, res) => {
        this.ok(res, await this.service.remove(this.idParam(req)));
      }),
    );
  }
}
