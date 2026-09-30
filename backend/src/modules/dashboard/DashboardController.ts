import { z } from "zod";
import { BaseController } from "../../core/http/BaseController";
import { CommonSchemas } from "../../core/validation/CommonSchemas";
import { DashboardService } from "./DashboardService";

export class DashboardController extends BaseController {
  readonly basePath = "/dashboard";

  private static readonly query = z.object({
    date: CommonSchemas.date.optional(),
    deliveryDate: CommonSchemas.date.optional(),
  });

  constructor(private readonly service: DashboardService) {
    super();
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.action(async (req, res) => {
        const query = DashboardController.query.parse(req.query);
        this.ok(res, await this.service.overview(query.deliveryDate ?? query.date));
      }),
    );
  }
}
