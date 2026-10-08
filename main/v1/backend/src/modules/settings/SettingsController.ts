import { BaseController } from "../../core/http/BaseController";
import { SettingsSchemas } from "./SettingsSchemas";
import { SettingsService } from "./SettingsService";

export class SettingsController extends BaseController {
  readonly basePath = "/settings";

  constructor(private readonly service: SettingsService) {
    super();
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.action(async (_req, res) => {
        this.ok(res, await this.service.get());
      }),
    );

    const update = this.action(async (req, res) => {
      const changes = SettingsSchemas.update.parse(req.body ?? {});
      this.ok(res, await this.service.update(changes));
    });

    this.router.put("/", update);
    this.router.patch("/", update);
  }
}
