import { BaseController } from "../../core/http/BaseController";
import { TrackingService } from "./TrackingService";

/** A random order-scoped capability; never exposes rider job codes or owner APIs. */
export class TrackingController extends BaseController {
  readonly basePath = "/tracking";
  override readonly requiresAuth = false;
  constructor(private readonly service: TrackingService) {
    super();
  }
  protected registerRoutes(): void {
    this.router.get(
      "/:code",
      this.action(async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Referrer-Policy", "no-referrer");
        this.ok(res, await this.service.get(String(req.params.code)));
      }),
    );
  }
}
